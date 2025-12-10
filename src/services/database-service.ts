import {Knex} from "knex";
import {createRequire} from "node:module";
import {
  DeleteChartFailureReason,
  DeleteCommandFailureReason,
} from "../enums/index.js";
import {Logger} from "./index.js";
import {
  ChartRow,
  CustomCommandRow,
  DeleteChartResult,
  DeleteCommandResult,
  FieldingErrorRow,
  FieldingRangeRow,
} from "../models/database";

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
        .where('command_name', commandName)
        .andWhere("guild_id", guildId)
        .first();
    }

    public async fetchAllCommands(): Promise<CustomCommandRow[]> {
      return knex<CustomCommandRow>('custom_command')
    }


    public async fetchAllCommandsMatchingString(commandName: string, guildId: string): Promise<CustomCommandRow[]> {
      return await knex<CustomCommandRow>('custom_command')
          .whereILike('command_name', `%${commandName}%`)
          .andWhere('guild_id', guildId)
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
          .where('position', position)
          .andWhere('roll', roll)
          .first()
    }

    public async fetchFieldingErrorData(position: string, roll: number): Promise<FieldingErrorRow[]> {
      return await knex<FieldingErrorRow>(   'fielding_error')
          .where('position', position)
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
    }

    public async fetchChart(chartName: string, guildId: string): Promise<ChartRow | undefined> {
        return knex<ChartRow>('chart')
            .where('chart_name', chartName)
            .andWhere("guild_id", guildId)
            .first();
    }

    public async fetchAllChartsMatchingString(chartName: string, guildId: string): Promise<ChartRow[]> {
        return await knex<ChartRow>('chart')
            .whereILike('chart_name', `%${chartName}%`)
            .andWhere('guild_id', guildId)
            .select('chart_name')
    }

    public async deleteChart(chartName: string, requestingUser: string, guildId: string): Promise<DeleteChartResult> {
        try {
            if (!(await this.chartExists(chartName, guildId))) {
                return { success: false, reason: DeleteChartFailureReason.CHART_DOES_NOT_EXIST };
            } else if ((await this.fetchCommand(chartName, guildId)).owner_username !== requestingUser) {
                return { success: false, reason: DeleteChartFailureReason.USER_NOT_OWNER}
            } else {
                await knex<CustomCommandRow>('chart').where('chart_name', chartName).del();
                return { success: true, reason: undefined };
            }
        } catch (error) {
            await Logger.error("Encountered an unexpected database error: "  + error);
            return { success: false, reason: DeleteChartFailureReason.UNKNOWN };
        }
    }

    public async chartExists(chartName: string, guildId: string): Promise<boolean> {
        return await this.fetchChart(chartName, guildId) !== undefined;
    }
}