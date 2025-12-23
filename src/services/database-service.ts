import {Knex} from "knex";
import {createRequire} from "node:module";
import {
  DeleteChartFailureReason,
  DeleteCommandFailureReason,
  PlayerType,
  RollType,
} from "../enums/index.js";
import {Logger} from "./index.js";
import {
  AbHistoryIndividualRollRow,
  AbHistoryRow,
  ChartRow,
  CustomCommandRow,
  CustomCommandUsageRow,
  DeleteChartResult,
  DeleteCommandResult,
  FieldingErrorRow,
  FieldingRangeRow,
  PlayerPositionRow,
  RollMapping,
} from "../models/database";
import {randomUUID} from 'crypto'
import {PlayerRow} from "../models/database/player-row";
import AWS, {AWSError} from "aws-sdk";
import {PromiseResult} from "aws-sdk/lib/request";
import {DeleteObjectOutput} from "aws-sdk/clients/s3";

const require = createRequire(import.meta.url);
let Config = require('../../config/config.json');

const knex: Knex = require('knex')({
    client: 'pg',
    connection: {
        host: Config.database.host,
        port: Config.database.port,
        user: Config.database.username,
        database: Config.database.database,
        password: Config.database.password,
    },
    pool: {
        min: 1, // Minimum number of connections in the pool
        max: 2, // Maximum number of connections in the pool
        acquireTimeoutMillis: 10000, // How long to wait for a connection to become available (in milliseconds)
        idleTimeoutMillis: 30000, // How long a connection can be idle before being closed (in milliseconds)
    }
})

export class DatabaseService {
    /**
    * TODO: Return something meaningful and add useful error handling
    * @param commandName
    * @param ownerUsername
    * @param link
    */
    public async insertCommand(commandName: string, ownerUsername: string, guildId: string, link: string): Promise<void> {
    await knex<CustomCommandRow>('custom_command')
      .insert({
          command_name: commandName,
          owner_username: ownerUsername,
          guild_id: guildId,
          link,
          created: new Date(),
      })
    }

    /**
    * Fetches either the singular command with the given command name or undefined if no such command exists.
    * @param commandName The name of the command to be retrieved
    * @param guildId The guild (Server) of Discord this command belongs to
    */
    public async fetchCommand(commandName: string, guildId: string): Promise<CustomCommandRow | undefined> {
    return knex<CustomCommandRow>('custom_command')
        .whereILike('command_name', commandName.toLowerCase())
        .andWhere("guild_id", guildId)
        .first();
    }

    public async fetchAllCommands(): Promise<CustomCommandRow[]> {
      return knex<CustomCommandRow>('custom_command').orderBy('command_name')
    }


    public async fetchAllCommandsMatchingString(commandName: string, guildId: string): Promise<CustomCommandRow[]> {
      return await knex<CustomCommandRow>('custom_command')
          .whereILike('command_name', `%${commandName}%`)
          .andWhere('guild_id', guildId)
          .orderBy('command_name')
          .select('command_name')
    }

    public async deleteCommand(commandName: string, requestingUser: string, guildId: string): Promise<DeleteCommandResult> {
      try {
          if (!(await this.commandExists(commandName, guildId))) {
              return { success: false, reason: DeleteCommandFailureReason.COMMAND_DOES_NOT_EXIST };
          } else if ((await this.fetchCommand(commandName, guildId)).owner_username !== requestingUser) {
              return { success: false, reason: DeleteCommandFailureReason.USER_NOT_OWNER}
          } else {
              await knex<CustomCommandRow>('custom_command').where('command_name', commandName).del();
              return { success: true, reason: undefined };
          }
      } catch (error) {
          await Logger.error("Encountered an unexpected database error: "  + error);
          return { success: false, reason: DeleteCommandFailureReason.UNKNOWN };
      }
    }

    public async fetchFieldingRange(position: string, roll: number): Promise<FieldingRangeRow> {
      return await knex<FieldingRangeRow>('fielding_range')
          .whereILike('position', position.toLowerCase())
          .andWhere('roll', roll)
          .first()
    }

    public async fetchFieldingErrorData(position: string, roll: number): Promise<FieldingErrorRow[]> {
      return await knex<FieldingErrorRow>(   'fielding_error')
          .whereILike('position', position.toLowerCase())
          .andWhere('roll', roll)
          .select('*')
    }

    /**
    * Wrapper around the fetchCommand method that returns true if the command exists and false if it does not -
    *  this is a convenience method to avoid the annoyance of checking for undefined
    *
    * @param commandName The name of the command whose existence should be verified
    */
    public async commandExists(commandName: string, guildId: string): Promise<boolean> {
    return await this.fetchCommand(commandName, guildId) !== undefined;
    }

    /**
     * TODO: Return something meaningful and add useful error handling
     * @param chartName
     * @param ownerUsername
     * @param link
     */
    public async insertChart(chartName: string, ownerUsername: string, guildId: string, description: string, title: string, imagelink: string): Promise<void> {
        await knex<ChartRow>('chart')
            .insert({
                chart_name: chartName,
                owner_username: ownerUsername,
                guild_id: guildId,
                description: description,
                title: title,
                image_link: imagelink,
                created: new Date(),
            })
    }

    public async fetchAllCharts(guildId: string): Promise<ChartRow[]> {
        return knex<ChartRow>('chart')
            .where('guild_id', guildId)
            .orderBy('chart_name')
    }

    public async fetchChart(chartName: string, guildId: string): Promise<ChartRow | undefined> {
        return knex<ChartRow>('chart')
            .whereILike('chart_name', chartName.toLowerCase())
            .andWhere("guild_id", guildId)
            .first();
    }

    public async fetchAllChartsMatchingString(chartName: string, guildId: string): Promise<ChartRow[]> {
        return await knex<ChartRow>('chart')
            .whereILike('chart_name', `%${chartName}%`)
            .andWhere('guild_id', guildId)
            .orderBy('chart_name')
            .select('chart_name')
    }

    public async deleteChart(chartName: string, requestingUser: string, guildId: string): Promise<DeleteChartResult> {
        try {
            if (!(await this.chartExists(chartName, guildId))) {
                return { success: false, reason: DeleteChartFailureReason.CHART_DOES_NOT_EXIST };
            } else if ((await this.fetchChart(chartName, guildId)).owner_username !== requestingUser) {
                return { success: false, reason: DeleteChartFailureReason.USER_NOT_OWNER}
            } else {
                if (await this.deleteChartFromS3(guildId, chartName)) {
                    await knex<ChartRow>('chart').where('chart_name', chartName).del();
                    return { success: true, reason: undefined };
                } else {
                    //TODO: Improve this error handling
                    await Logger.error("Encountered an error with S3");
                    return { success: false, reason: DeleteChartFailureReason.UNKNOWN };
                }
            }
        } catch (error) {
            await Logger.error("Encountered an unexpected database error: "  + error);
            return { success: false, reason: DeleteChartFailureReason.UNKNOWN };
        }
    }

    private async deleteChartFromS3(guildId: string, chartName: string): Promise<boolean> {
        const s3 = new AWS.S3();
        const result: PromiseResult<DeleteObjectOutput, AWSError> = await s3.deleteObject({
          Bucket: Config.s3.chartBucket,
          Key: `${guildId}/${chartName}.png`,
        }).promise();

        if (result.$response.httpResponse.statusCode === 204) {
            return true
        } else {
            return false
        }
    }

    public async chartExists(chartName: string, guildId: string): Promise<boolean> {
        return await this.fetchChart(chartName, guildId) !== undefined;
    }

    public async logChaosRoll(username: string, guildId: string, chaosRoll: number): Promise<void> {
        await knex<AbHistoryRow>('ab_history')
            .insert({
                uuid: randomUUID(),
                username: username,
                guild_id: guildId,
                roll_type: RollType.CHAOS,
                roll_value: chaosRoll,
                roll_date: new Date(),
            })
    }

    public async logAtBatRolls(username: string, guildId: string, rolls: RollMapping): Promise<void> {
        const uuidFor2d6 = randomUUID()

        await knex<AbHistoryRow>('ab_history')
            .insert([
                {
                    uuid: randomUUID(),
                    username: username,
                    guild_id: guildId,
                    roll_type: RollType.D20,
                    roll_value: rolls.d20,
                    roll_date: new Date(),
                },
                    {
                    uuid: uuidFor2d6,
                    username: username,
                    guild_id: guildId,
                    roll_type: RollType.TWOD6,
                    roll_value: rolls.twod6.reduce((acc, currentValue) => acc + currentValue, 0),
                    roll_date: new Date(),
                },
                {
                    uuid: randomUUID(),
                    username: username,
                    guild_id: guildId,
                    roll_type: RollType.D6,
                    roll_value: rolls.d6,
                    roll_date: new Date(),
                }
            ])


        await knex<AbHistoryIndividualRollRow>('ab_history_individual_rolls')
            .insert([
                {
                    uuid: uuidFor2d6,
                    sequence_number: 1,
                    roll_value: rolls.twod6[0]
                },
                {
                    uuid: uuidFor2d6,
                    sequence_number: 2,
                    roll_value: rolls.twod6[1]
                }
            ])
    }

    public async fetchAbHistory(username: string, guildId: string, rollType: RollType, count: number): Promise<AbHistoryRow[]> {
        const typeToFetch = rollType === RollType.ALL ? [RollType.D20, RollType.D6, RollType.TWOD6] : [rollType]
        const limit = rollType === RollType.ALL ? count * 3 : count

        return knex<AbHistoryRow>('ab_history')
            .select('*')
            .whereIn('roll_type', typeToFetch)
            .where('username', username)
            .andWhere('guild_id', guildId)
            .orderBy('roll_date', 'desc')
            .limit(limit)
    }

    public async fetchPlayer(playerName: string): Promise<PlayerRow[] | undefined> {
        return knex<PlayerRow>('player')
            .whereILike('player_name', playerName.toLowerCase())
            .join('player_position', 'player.uuid', 'player_position.uuid')
            .orderBy('player_name')
            .select('player.*', 'player_position.position')
    }

    public async fetchAllPlayersMatchingString(playerName: string): Promise<PlayerRow[]> {
        return await knex<PlayerRow>('player')
            .whereILike('player_name', `%${playerName}%`)
            .orderBy('player_name')
            .select('player_name')
    }

    async insertPlayer(playerName: string, positions: string[], cardUrl: string, playerType: PlayerType, season: string) {
        const playerUuid = randomUUID()
        await knex<PlayerRow>("player").insert({
            uuid: playerUuid,
            player_name: playerName,
            card_url: cardUrl,
            player_type: playerType,
            year: parseInt(season, 10),
            active: true
        });

        await knex<PlayerPositionRow>('ab_history')
            .insert(positions.map((position) => {return { uuid: playerUuid, position }}))
    }

    async insertCommandUsage(command_name: string, userId: string, guildId: string) {
        await knex<CustomCommandUsageRow>('custom_command_usage').insert({
            command_name: command_name,
            guild_id: guildId,
            calling_userid: userId,
            usage_date: new Date(),
        })
    }
}