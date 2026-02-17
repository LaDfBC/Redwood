import {
  ApplicationCommandOptionChoiceData,
  AutocompleteFocusedOption,
  AutocompleteInteraction,
  ChatInputCommandInteraction,
  EmbedBuilder,
  PermissionsString,
} from "discord.js";

import fetch from 'node-fetch';

import {Language} from '../../models/enum-helpers/index.js';
import {EventData} from '../../models/internal-models.js';
import {Lang} from '../../services/index.js';
import {EmbedUtils, InteractionUtils} from '../../utils/index.js';
import {Command, CommandDeferType} from '../index.js';
import {DatabaseService} from "../../services/database-service";
import { CustomCommandRow } from "../../models/database";

export class CcFetchCommand implements Command {
    constructor(
        private databaseService: DatabaseService,
    ) {}

    public names = [Lang.getRef('chatCommands.cc-fetch', Language.Default)];
    public deferType = CommandDeferType.PUBLIC;
    public requireClientPerms: PermissionsString[] = [];
    public async execute(intr: ChatInputCommandInteraction, data: EventData): Promise<void> {
        let args: { name: string } = {
            name: intr.options.getString(
                Lang.getRef('arguments.ccFetchNameOption', Language.Default)
            )
        };

        let embed: EmbedBuilder;

        const result: CustomCommandRow | undefined = await this.databaseService.fetchCommand(args.name, intr.guildId)
        await this.databaseService.insertCommandUsage(result.command_name, intr.user.id, intr.guildId);
        if (result === undefined) {
            embed = Lang.getEmbed('displayEmbeds.ccNameDoesNotExist', data.lang, {
                COMMAND_NAME: args.name
            })
            await InteractionUtils.send(intr, embed);
        } else {
             // SUCCESS - Simply return the requested command
            if (result.link.startsWith('https://tenor.com')) {
                const gifUrl = await getGifUrl(result.link);
                embed = Lang.getEmbed('displayEmbeds.ccFetchSuccessImage', data.lang, {
                    COMMAND_NAME: args.name,
                    IMAGE_LINK: gifUrl ?? result.link,
                });
            } else if (result.link.includes('.gif') || result.link.includes('.png') || result.link.includes('.jpg')) {
                embed = Lang.getEmbed('displayEmbeds.ccFetchSuccessImage', data.lang, {
                    COMMAND_NAME: args.name,
                    IMAGE_LINK: result.link
                })
            } else {
                embed = Lang.getEmbed('displayEmbeds.ccFetchSuccessText', data.lang, {
                    COMMAND_NAME: args.name,
                    LINK: result.link
                })
            }
            await EmbedUtils.applyUserTheme(embed, this.databaseService, intr.user.id, intr.guildId);
            await InteractionUtils.send(intr, embed)
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

async function getGifUrl(viewUrl: string): Promise<string | null> {
    const embedUrl = viewUrl.replace(/\/view\/[^/?]+-(\d+)/, '/embed/$1');
    const response = await fetch(embedUrl);
    if (!response.ok) {
        return null;
    }
    const html = await response.text();
    const scriptMatch = html.match(/<script\s+id="gif-json"[^>]*>(.+?)<\/script>/);
    if (!scriptMatch) {
        return null;
    }
    const gifData = JSON.parse(scriptMatch[1]);
    return gifData.media_formats?.gif.url.replace('https://media1.tenor.com/m/', 'https://c.tenor.com/') ?? null;
}
