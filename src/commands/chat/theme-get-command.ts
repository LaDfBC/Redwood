import { ChatInputCommandInteraction, EmbedBuilder, PermissionsString } from 'discord.js';

import { Language } from '../../models/enum-helpers/index.js';
import { EventData } from '../../models/internal-models.js';
import { Lang } from '../../services/index.js';
import { EmbedUtils, InteractionUtils } from '../../utils/index.js';
import { Command, CommandDeferType } from '../index.js';
import { DatabaseService } from '../../services/database-service.js';

export class ThemeGetCommand implements Command {
    constructor(private databaseService: DatabaseService) {}

    public names = ['user-settings', 'theme', 'get'];
    public deferType = CommandDeferType.PUBLIC;
    public requireClientPerms: PermissionsString[] = [];

    public async execute(intr: ChatInputCommandInteraction, data: EventData): Promise<void> {
        let settings = await this.databaseService.fetchUserSettings(intr.user.id, intr.guildId);

        let embed: EmbedBuilder;
        if (settings) {
            embed = Lang.getEmbed('displayEmbeds.themeGetSuccess', data.lang, {
                PRIMARY_COLOR: settings.primary_color ?? 'Not set',
                TEXT_COLOR: settings.text_color ?? 'Not set'
            });
            await EmbedUtils.applyUserTheme(embed, this.databaseService, intr.user.id, intr.guildId);
        } else {
            embed = Lang.getEmbed('displayEmbeds.themeGetNoTheme', data.lang);
        }

        await InteractionUtils.send(intr, embed);
    }
}
