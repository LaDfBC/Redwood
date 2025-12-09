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
import { CustomCommandRow } from "../../models/database";

export class CcFetchCommand implements Command {
    constructor(
        private databaseService: DatabaseService,
    ) {}

    public names = [Lang.getRef('chatCommands.cc-fetch', Language.Default)];
    public deferType = CommandDeferType.HIDDEN;
    public requireClientPerms: PermissionsString[] = [];
    public async execute(intr: ChatInputCommandInteraction, data: EventData): Promise<void> {
        let args: { name: string } = {
            name: intr.options.getString(
                Lang.getRef('arguments.ccFetchNameOption', Language.Default)
            )
        };

        let embed: EmbedBuilder;

        const result: CustomCommandRow | undefined = await this.databaseService.fetchCommand(args.name, intr.guildId)
        if (result === undefined) {
            embed = Lang.getEmbed('displayEmbeds.ccNameDoesNotExist', data.lang, {
                COMMAND_NAME: args.name
            })

            await InteractionUtils.send(intr, embed);
        } else {
            // SUCCESS - Simply return the requested command
            await InteractionUtils.send(intr, result.link)
        }
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
