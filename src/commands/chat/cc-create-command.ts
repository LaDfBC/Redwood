import { ChatInputCommandInteraction, EmbedBuilder, PermissionsString, ShardingManager} from 'discord.js';

import { Language } from '../../models/enum-helpers/index.js';
import { EventData } from '../../models/internal-models.js';
import { Lang } from '../../services/index.js';
import { InteractionUtils } from '../../utils/index.js';
import { Command, CommandDeferType } from '../index.js';
import { DatabaseService } from "../../services/database-service";

export class CcCreateCommand implements Command {
  constructor(
    private databaseService: DatabaseService,
  ) {}

  public names = [Lang.getRef('chatCommands.cc-create', Language.Default)];
  public deferType = CommandDeferType.HIDDEN;
  public requireClientPerms: PermissionsString[] = [];
  public async execute(intr: ChatInputCommandInteraction, data: EventData): Promise<void> {
    let args: { name: string, action: string } = {
      name: intr.options.getString(
        Lang.getRef('arguments.cc-create-name-option', Language.Default)
      ),
      action: intr.options.getString(
        Lang.getRef('arguments.cc-create-action-option', Language.Default)
      )
    };

    let embed: EmbedBuilder;
    if (await this.databaseService.commandExists(args.name, intr.guildId)) {
      embed = Lang.getEmbed('displayEmbeds.ccCreateCommandNameAlreadyExists', data.lang, {
        //TODO: Get the username of the already-existing command so that we can show a better display message.
        COMMAND_NAME: args.name
      });
    } else {
      await this.databaseService.insertCommand(args.name, intr.user.username, intr.guildId, args.action)
      embed = Lang.getEmbed('displayEmbeds.ccCreateCommandSuccessful', data.lang, {
        COMMAND_NAME: args.name
      })
    }

    await InteractionUtils.send(intr, embed);
  }
}
