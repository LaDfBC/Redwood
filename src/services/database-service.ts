import {Knex} from "knex";
import {createRequire} from "node:module";
import {
  DeleteChartFailureReason,
  EditChartFailureReason,
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
  CustomCommandWithUsageCountRow,
  DeleteChartResult,
  EditChartResult,
  DeleteCommandResult,
  FieldingErrorRow,
  FieldingRangeRow,
  GameContextRow,
  GameReportRow,
  TransactionReportRow,
  PlayerPositionRow,
  RollMapping,
  UserSettingsRow,
} from "../models/database";
import {randomUUID} from 'crypto'
import {PlayerRow} from "../models/database/player-row";
import AWS, {AWSError} from "aws-sdk";
import {PromiseResult} from "aws-sdk/lib/request";
import {DeleteObjectOutput} from "aws-sdk/clients/s3";
import {MessagePaginationRow} from "../models/database/message-pagination-row";
import * as sea from "node:sea";

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

function delay(ms: number) {
    return new Promise( resolve => setTimeout(resolve, ms) );
}

export class DatabaseService {
    private async retryOnce<R>(fn:() => R): Promise<R> {
      // Return a new function
      let isRetry = false;
      try {
        return await fn();
      } catch (error: any) {
        await delay(1000);
        return await fn();
      }
    }

    /**
    * TODO: Return something meaningful and add useful error handling
    * @param commandName
    * @param ownerUsername
    * @param link
    */
    public async insertCommand(commandName: string, ownerUsername: string, guildId: string, link: string): Promise<void> {
        return await this.retryOnce(async (): Promise<void> => {
            await knex<CustomCommandRow>('custom_command')
                .insert({
                  command_name: commandName,
                  owner_username: ownerUsername,
                  guild_id: guildId,
                  link,
                  created: new Date(),
              })
        })
    }

    /**
    * Fetches either the singular command with the given command name or undefined if no such command exists.
    * @param commandName The name of the command to be retrieved
    * @param guildId The guild (Server) of Discord this command belongs to
    */
    public async fetchCommand(commandName: string, guildId: string): Promise<CustomCommandRow | undefined> {
        return await this.retryOnce(async (): Promise<CustomCommandRow> => {
            return knex<CustomCommandRow>('custom_command')
                .whereILike('command_name', commandName.toLowerCase())
                .andWhere("guild_id", guildId)
                .first();
        })
    }

    public async fetchAllCommands(): Promise<CustomCommandRow[]> {
      return knex<CustomCommandRow>('custom_command').orderBy('command_name')
    }

    public async fetchAllCommandsForUser(guildId: string, userId: string): Promise<CustomCommandWithUsageCountRow[]> {
        return await this.retryOnce(async (): Promise<CustomCommandWithUsageCountRow[]> => {
            return await knex<CustomCommandUsageRow>("custom_command")
                .leftOuterJoin("custom_command_usage", "custom_command.command_name", "custom_command_usage.command_name")
                .where("custom_command.guild_id", guildId)
                .andWhere("custom_command.owner_username", userId)
                .groupBy("custom_command.command_name", "custom_command.guild_id", "custom_command.owner_username", "custom_command.link", "custom_command.created")
                .orderBy("custom_command.created")
                .select(["custom_command.*", knex.raw("count(custom_command_usage.*) as usage_count")])
        })
    }


    public async fetchAllCommandsMatchingString(commandName: string, guildId: string): Promise<CustomCommandRow[]> {
        return await this.retryOnce(async (): Promise<CustomCommandRow[]> => {
            return await knex<CustomCommandRow>('custom_command')
              .whereILike('command_name', `%${commandName}%`)
              .andWhere('guild_id', guildId)
              .orderBy('command_name')
              .select('command_name')
        })
    }

    public async deleteCommand(commandName: string, requestingUser: string, guildId: string): Promise<DeleteCommandResult> {
        return await this.retryOnce(async (): Promise<DeleteCommandResult> => {
            try {
              if (!(await this.commandExists(commandName, guildId))) {
                  return { success: false, reason: DeleteCommandFailureReason.COMMAND_DOES_NOT_EXIST };
              } else if ((await this.fetchCommand(commandName, guildId)).owner_username !== requestingUser) {
                  return { success: false, reason: DeleteCommandFailureReason.USER_NOT_OWNER}
              } else {
                  await knex<CustomCommandRow>('custom_command_usage').where('command_name', commandName).del();
                  await knex<CustomCommandRow>('custom_command').where('command_name', commandName).del();
                  return { success: true, reason: undefined };
              }
          } catch (error) {
              await Logger.error("Encountered an unexpected database error: "  + error);
              return { success: false, reason: DeleteCommandFailureReason.UNKNOWN };
          }
        })
    }

    public async fetchFieldingRange(position: string, roll: number): Promise<FieldingRangeRow> {
        return await this.retryOnce(async (): Promise<FieldingRangeRow> => {
            return await knex<FieldingRangeRow>('fielding_range')
              .whereILike('position', position.toLowerCase())
              .andWhere('roll', roll)
              .first()
        })
    }

    public async fetchFieldingErrorData(position: string, roll: number): Promise<FieldingErrorRow[]> {
        return await this.retryOnce(async (): Promise<FieldingErrorRow[]> => {
            return await knex<FieldingErrorRow>(   'fielding_error')
              .whereILike('position', position.toLowerCase())
              .andWhere('roll', roll)
              .select('*')
        })
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
        return await this.retryOnce(async (): Promise<void> => {
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
        })
    }

    public async fetchAllCharts(guildId: string): Promise<ChartRow[]> {
        return await this.retryOnce(async (): Promise<ChartRow[]> => {
            return knex<ChartRow>('chart')
                .where('guild_id', guildId)
                .orderBy('chart_name')
        })
    }

    public async fetchChart(chartName: string, guildId: string): Promise<ChartRow | undefined> {
        return await this.retryOnce(async (): Promise<ChartRow | undefined> => {
            return knex<ChartRow>('chart')
                .whereILike('chart_name', chartName.toLowerCase())
                .andWhere("guild_id", guildId)
                .first();
        })
    }

    public async fetchAllChartsMatchingString(chartName: string, guildId: string): Promise<ChartRow[]> {
        return await this.retryOnce(async (): Promise<ChartRow[]> => {
            return await knex<ChartRow>('chart')
                .whereILike('chart_name', `%${chartName}%`)
                .andWhere('guild_id', guildId)
                .orderBy('chart_name')
                .select('chart_name')
        })
    }

    public async deleteChart(chartName: string, requestingUser: string, guildId: string): Promise<DeleteChartResult> {
        return await this.retryOnce(async (): Promise<DeleteChartResult> => {
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
        })
    }

    public async updateChart(
        chartName: string,
        requestingUser: string,
        guildId: string,
        updates: { chart_name?: string; image_link?: string }
    ): Promise<EditChartResult> {
        return await this.retryOnce(async (): Promise<EditChartResult> => {
            try {
                if (!(await this.chartExists(chartName, guildId))) {
                    return { success: false, reason: EditChartFailureReason.CHART_DOES_NOT_EXIST };
                } else if ((await this.fetchChart(chartName, guildId)).owner_username !== requestingUser) {
                    return { success: false, reason: EditChartFailureReason.USER_NOT_OWNER };
                } else if (updates.chart_name && await this.chartExists(updates.chart_name, guildId)) {
                    return { success: false, reason: EditChartFailureReason.NAME_ALREADY_EXISTS };
                } else {
                    const updateObj: Record<string, any> = {};
                    if (updates.chart_name) updateObj.chart_name = updates.chart_name;
                    if (updates.image_link) updateObj.image_link = updates.image_link;
                    await knex<ChartRow>('chart')
                        .where('chart_name', chartName)
                        .andWhere('guild_id', guildId)
                        .update(updateObj);
                    return { success: true, reason: undefined };
                }
            } catch (error) {
                await Logger.error("Encountered an unexpected database error: " + error);
                return { success: false, reason: EditChartFailureReason.UNKNOWN };
            }
        })
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
        return await this.retryOnce(async (): Promise<void> => {
            await knex<AbHistoryRow>('ab_history')
                .insert({
                    uuid: randomUUID(),
                    username: username,
                    guild_id: guildId,
                    roll_type: RollType.CHAOS,
                    roll_value: chaosRoll,
                    roll_date: new Date(),
                })
        })
    }

    public async logAtBatRolls(username: string, guildId: string, rolls: RollMapping): Promise<void> {
        const uuidFor2d6 = randomUUID()

        await this.retryOnce(async (): Promise<void> => {
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
        })

        await this.retryOnce(async (): Promise<void> => {
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
        })
    }

    public async fetchAbHistory(username: string, guildId: string, rollType: RollType, count: number): Promise<AbHistoryRow[]> {
        const typeToFetch = rollType === RollType.ALL ? [RollType.D20, RollType.D6, RollType.TWOD6] : [rollType]
        const limit = rollType === RollType.ALL ? count * 3 : count

        return await this.retryOnce(async (): Promise<AbHistoryRow[]> => {
            return knex<AbHistoryRow>('ab_history')
                .select('*')
                .whereIn('roll_type', typeToFetch)
                .where('username', username)
                .andWhere('guild_id', guildId)
                .orderBy('roll_date', 'desc')
                .limit(limit)
        })
    }

    public async fetchPlayer(playerName: string, season: number): Promise<PlayerRow[] | undefined> {
        return await this.retryOnce(async (): Promise<PlayerRow[] | undefined> => {
            return knex<PlayerRow>('player')
                .whereILike('player_name', playerName.toLowerCase())
                .andWhere('year', season)
                .leftJoin('player_position', 'player.uuid', 'player_position.uuid')
                .orderBy('player_name')
                .select('player.*', 'player_position.position')
        })
    }

    public async playerExists(playerName: string): Promise<boolean> {
        return await this.retryOnce(async (): Promise<boolean> => {
            const result = await knex<PlayerRow>('player')
                .whereILike('player_name', playerName.toLowerCase())
                .first();
            return result !== undefined;
        })
    }

    public async fetchAllPlayersMatchingString(playerName: string): Promise<PlayerRow[]> {
        return await this.retryOnce(async (): Promise<PlayerRow[]> => {
            return await knex<PlayerRow>('player')
                .whereILike('player_name', `%${playerName}%`)
                .orderBy('player_name')
                .select('player_name').distinct()
        })
    }

    public async fetchAllSeasonsMatchingString(seasonString: string): Promise<PlayerRow[]> {
        return await this.retryOnce(async (): Promise<PlayerRow[]> => {
            return await knex<PlayerRow>('player')
                .whereILike('year', `%${seasonString}%`)
                .orderBy('year')
                .select('year').distinct()
        })
    }

    async insertPlayer(playerName: string, positions: string[], cardUrl: string, playerType: PlayerType, season: string): Promise<void> {
        const playerUuid = randomUUID()
        return await this.retryOnce(async (): Promise<void> => {
            await knex<PlayerRow>("player").insert({
                uuid: playerUuid,
                player_name: playerName,
                card_url: cardUrl,
                player_type: playerType,
                year: parseInt(season, 10),
                active: true
            });
        })

        return await this.retryOnce(async (): Promise<void> => {
            await knex<PlayerPositionRow>('ab_history')
                .insert(positions.map((position) => {return { uuid: playerUuid, position }}))
        })
    }

    async insertCommandUsage(command_name: string, userId: string, guildId: string): Promise<void> {
        return await this.retryOnce(async (): Promise<void> => {
            await knex<CustomCommandUsageRow>('custom_command_usage').insert({
                command_name: command_name,
                guild_id: guildId,
                calling_userid: userId,
                usage_date: new Date(),
            })
        })
    }

    async fetchCommandUsage(command_name: string, guildId: string): Promise<CustomCommandUsageRow[]> {
        return await this.retryOnce(async (): Promise<CustomCommandUsageRow[]> => {
            return knex<CustomCommandUsageRow>("custom_command_usage")
                .where("custom_command.guild_id", guildId)
                .andWhere("custom_command.command_name", command_name)
                .join("custom_command", "custom_command.command_name", "custom_command_usage.command_name")
                .select("custom_command_usage.*", "custom_command.created")
        })
    }

    async insertMineCommandMessage(messageId: string, guildId: string, page: number): Promise<void> {
        return await this.retryOnce(async (): Promise<void> => {
            await knex<MessagePaginationRow>('message_pagination')
                .insert({
                    message_id: messageId,
                    guild_id: guildId,
                    page: page,
                    created_timestamp: new Date(),
                    updated_timestamp: new Date(),
                })
        })
    }

    async fetchMessagePaginationData(messageId: string, guildId: string): Promise<MessagePaginationRow> {
        return await this.retryOnce(async (): Promise<MessagePaginationRow> => {
            return await knex<MessagePaginationRow>('message_pagination')
                .where('message_id', messageId)
                .andWhere("guild_id", guildId)
                .first()
        })
    }

    async updateMesssagePaginationData(messageId: string, newMessageId: string, guildId: string, page: number): Promise<void> {
        return await this.retryOnce(async (): Promise<void> => {
            await knex<MessagePaginationRow>('message_pagination')
                .where("message_id", messageId)
                .andWhere("guild_id", guildId)
                .update({
                    "page": page,
                    "message_id": newMessageId,
                    updated_timestamp: new Date(),
                })
        })
    }

    async fetchUserSettings(userId: string, guildId: string): Promise<UserSettingsRow | undefined> {
        return await this.retryOnce(async (): Promise<UserSettingsRow | undefined> => {
            return knex<UserSettingsRow>('user_settings')
                .where('user_id', userId)
                .andWhere('guild_id', guildId)
                .first()
        })
    }

    async upsertUserSettings(userId: string, guildId: string, primaryColor: string, textColor: string): Promise<void> {
        return await this.retryOnce(async (): Promise<void> => {
            const existing = await knex<UserSettingsRow>('user_settings')
                .where('user_id', userId)
                .andWhere('guild_id', guildId)
                .first()

            if (existing) {
                await knex<UserSettingsRow>('user_settings')
                    .where('user_id', userId)
                    .andWhere('guild_id', guildId)
                    .update({
                        primary_color: primaryColor ?? existing.primary_color,
                        text_color: textColor ?? existing.text_color,
                        updated_timestamp: new Date(),
                    })
            } else {
                await knex<UserSettingsRow>('user_settings')
                    .insert({
                        user_id: userId,
                        guild_id: guildId,
                        primary_color: primaryColor,
                        text_color: textColor,
                        created_timestamp: new Date(),
                        updated_timestamp: new Date(),
                    })
            }
        })
    }

    async clearUserSettingsFields(userId: string, guildId: string, fields: string[]): Promise<void> {
        return await this.retryOnce(async (): Promise<void> => {
            const updateObj: Record<string, any> = { updated_timestamp: new Date() };
            for (const field of fields) {
                updateObj[field] = null;
            }
            await knex<UserSettingsRow>('user_settings')
                .where('user_id', userId)
                .andWhere('guild_id', guildId)
                .update(updateObj)
        })
    }

    async deleteUserSettings(userId: string, guildId: string): Promise<void> {
        return await this.retryOnce(async (): Promise<void> => {
            await knex<UserSettingsRow>('user_settings')
                .where('user_id', userId)
                .andWhere('guild_id', guildId)
                .del()
        })
    }

    public async fetchGameContext(serverId: string, channelId: string): Promise<GameContextRow | undefined> {
        return await this.retryOnce(async (): Promise<GameContextRow | undefined> => {
            return knex<GameContextRow>('game_context')
                .where({ server_id: serverId, channel_id: channelId })
                .first();
        });
    }

    public async upsertGameContext(serverId: string, channelId: string, sheetLink: string): Promise<void> {
        return await this.retryOnce(async (): Promise<void> => {
            await knex<GameContextRow>('game_context')
                .where({ server_id: serverId, channel_id: channelId })
                .delete();
            await knex<GameContextRow>('game_context')
                .insert({
                    server_id: serverId,
                    channel_id: channelId,
                    sheet_link: sheetLink,
                    created: new Date(),
                });
        });
    }

    public async isGameReportPosted(gameId: string): Promise<boolean> {
        return await this.retryOnce(async (): Promise<boolean> => {
            const row = await knex<GameReportRow>('game_report_history')
                .where({ game_id: gameId })
                .first();
            return row !== undefined;
        });
    }

    public async insertGameReport(gameId: string, sheetId: string, channelId: string): Promise<void> {
        return await this.retryOnce(async (): Promise<void> => {
            await knex<GameReportRow>('game_report_history').insert({
                game_id: gameId,
                sheet_id: sheetId,
                channel_id: channelId,
                posted_at: new Date(),
            });
        });
    }

    public async isTransactionReportPosted(transId: string): Promise<boolean> {
        return await this.retryOnce(async (): Promise<boolean> => {
            const row = await knex<TransactionReportRow>('transaction_report_history')
                .where({ trans_id: transId })
                .first();
            return row !== undefined;
        });
    }

    public async insertTransactionReport(transId: string, channelId: string): Promise<void> {
        return await this.retryOnce(async (): Promise<void> => {
            await knex<TransactionReportRow>('transaction_report_history').insert({
                trans_id: transId,
                channel_id: channelId,
                posted_at: new Date(),
            });
        });
    }
}