import {Knex} from "knex";
import {createRequire} from "node:module";
import {DeleteCommandFailureReason} from "../enums/index.js";
import {Logger} from "./index.js";
import { CustomCommandRow, DeleteCommandResult } from "../models/database";

const require = createRequire(import.meta.url);
let Config = require('../../config/config.json');

export class DatabaseService {
  private async connect(): Promise<Knex> {
    return require('knex')({
      client: 'pg',
      connection: {
        host: Config.database.host,
        port: Config.database.port,
        user: Config.database.username,
        database: Config.database.database,
        password: Config.database.password,
      },
    });
  }

  /**
   * TODO: Return something meaningful and add useful error handling
   * @param commandName
   * @param ownerUsername
   * @param link
   */
  public async insertCommand(commandName: string, ownerUsername: string, guildId: string, link: string): Promise<void> {
    const knex: Knex = await this.connect();
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
    const knex: Knex = await this.connect();
    return knex<CustomCommandRow>('custom_command')
        .where('command_name', commandName)
        .andWhere("guild_id", guildId)
        .first();
  }

  public async fetchAllCommands(): Promise<CustomCommandRow[]> {
      const knex: Knex = await this.connect();
      return knex<CustomCommandRow>('custom_command')
  }

  public async fetchAllCommandsMatchingString(commandName: string, guildId: string): Promise<CustomCommandRow[]> {
      const knex: Knex = await this.connect();
      return knex<CustomCommandRow>('custom_command')
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
              const knex: Knex = await this.connect();
              await knex<CustomCommandRow>('custom_command').where('command_name', commandName).del();
              return { success: true, reason: undefined };
          }
      } catch (error) {
          await Logger.error("Encountered an unexpected database error: "  + error);
          return { success: false, reason: DeleteCommandFailureReason.UNKNOWN };
      }
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
}