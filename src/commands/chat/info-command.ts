import { ChatInputCommandInteraction, EmbedBuilder, PermissionsString } from 'discord.js';

import { InfoOption } from '../../enums/index.js';
import { Language } from '../../models/enum-helpers/index.js';
import { EventData } from '../../models/internal-models.js';
import { DatabaseService, Lang } from '../../services/index.js';
import { EmbedUtils, InteractionUtils } from '../../utils/index.js';
import { Command, CommandDeferType } from '../index.js';

export class InfoCommand implements Command {
    constructor(private databaseService: DatabaseService) {}

    public names = [Lang.getRef('chatCommands.info', Language.Default)];
    public deferType = CommandDeferType.PUBLIC;
    public requireClientPerms: PermissionsString[] = [];

    public async execute(intr: ChatInputCommandInteraction, data: EventData): Promise<void> {
        let args = {
            option: intr.options.getString(
                Lang.getRef('arguments.option', Language.Default)
            ) as InfoOption,
        };

        let embed: EmbedBuilder;
        switch (args.option) {
            case InfoOption.ABOUT: {
                embed = Lang.getEmbed('displayEmbeds.about', data.lang);
                break;
            }
            default: {
                return;
            }
        }

        await EmbedUtils.applyUserTheme(embed, this.databaseService, intr.user.id, intr.guildId);
        await InteractionUtils.send(intr, embed);
    }
}
