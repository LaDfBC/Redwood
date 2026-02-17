import { ColorResolvable, EmbedBuilder } from 'discord.js';

import { DatabaseService } from '../services/index.js';

export class EmbedUtils {
    public static async applyUserTheme(
        embed: EmbedBuilder,
        databaseService: DatabaseService,
        userId: string,
        guildId: string
    ): Promise<void> {
        const userSettings = await databaseService.fetchUserSettings(userId, guildId);
        if (userSettings?.primary_color) {
            embed.setColor(userSettings.primary_color as ColorResolvable);
        }
    }
}
