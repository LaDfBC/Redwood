import {
  ApplicationCommandOptionChoiceData,
  AutocompleteFocusedOption,
  AutocompleteInteraction,
  ChatInputCommandInteraction,
  EmbedBuilder,
  PermissionsString,
} from "discord.js";

import {Language} from '../../models/enum-helpers/index.js';
import {EventData} from '../../models/internal-models.js';
import {Lang} from '../../services/index.js';
import {InteractionUtils} from '../../utils/index.js';
import {Command, CommandDeferType} from '../index.js';
import {DatabaseService} from "../../services/database-service";
import { CustomCommandRow, DeleteCommandResult } from "../../models/database";
import {DeleteCommandFailureReason} from "../../enums/index.js";

export class CcDeleteCommand implements Command {
    constructor(
        private databaseService: DatabaseService,
    ) {}

    public names = [Lang.getRef('chatCommands.cc-delete', Language.Default)];
    public deferType = CommandDeferType.HIDDEN;
    public requireClientPerms: PermissionsString[] = [];
    public async execute(intr: ChatInputCommandInteraction, data: EventData): Promise<void> {
        let args: { name: string } = {
            name: intr.options.getString(
                Lang.getRef('arguments.ccDeleteNameOption', Language.Default)
            )
        };

        let embed: EmbedBuilder;
        const result: DeleteCommandResult = await this.databaseService.deleteCommand(args.name, intr.user.username, intr.guildId)
        if (result.success) {
            embed = Lang.getEmbed('displayEmbeds.ccDeleteCommandSuccessful', data.lang, {
                COMMAND_NAME: args.name
            })
        } else {
            switch (result.reason) {
                case DeleteCommandFailureReason.COMMAND_DOES_NOT_EXIST:
                    embed = Lang.getEmbed('displayEmbeds.ccDeleteNameDoesNotExist', data.lang, {
                        COMMAND_NAME: args.name
                    })
                    break;
                case DeleteCommandFailureReason.USER_NOT_OWNER:
                    embed = Lang.getEmbed('displayEmbeds.ccDeleteUserNotOwner', data.lang, {
                        COMMAND_NAME: args.name,
                        USER_NAME: intr.user.username
                    })
                    break;
                case DeleteCommandFailureReason.UNKNOWN:
                    embed = Lang.getEmbed('displayEmbeds.ccDeleteUnknownError', data.lang, {
                        COMMAND_NAME: args.name
                    })
                    break;
                default:
                    embed = Lang.getEmbed('displayEmbeds.ccDeleteUnknownReason', data.lang, {
                        COMMAND_NAME: args.name
                    })
                    break;
            }
        }

        await InteractionUtils.send(intr, embed);
    }

    public async autocomplete(intr: AutocompleteInteraction, option: AutocompleteFocusedOption): Promise<ApplicationCommandOptionChoiceData<string | number>[]> {
        const searchString = option.value
        const commands: CustomCommandRow[] = await this.databaseService.fetchAllCommandsMatchingString(searchString, intr.guildId);
        return commands.map((command: CustomCommandRow) => {
            return {
                name: command.command_name,
                name_localizations: {
                    "en-US": command.command_name,
                },
                value: command.command_name,
            };
        })
    }
}
