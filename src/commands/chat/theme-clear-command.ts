import { ChatInputCommandInteraction, EmbedBuilder, PermissionsString } from 'discord.js';

import { Language } from '../../models/enum-helpers/index.js';
import { EventData } from '../../models/internal-models.js';
import { Lang } from '../../services/index.js';
import { InteractionUtils } from '../../utils/index.js';
import { Command, CommandDeferType } from '../index.js';
import { DatabaseService } from '../../services/database-service.js';

export class ThemeClearCommand implements Command {
    constructor(private databaseService: DatabaseService) {}

    public names = ['user-settings', 'theme', 'clear'];
    public deferType = CommandDeferType.PUBLIC;
    public requireClientPerms: PermissionsString[] = [];

    public async execute(intr: ChatInputCommandInteraction, data: EventData): Promise<void> {
        let clearPrimary = intr.options.getBoolean(
            Lang.getRef('arguments.themeClearPrimaryColorOption', Language.Default)
        );
        let clearText = intr.options.getBoolean(
            Lang.getRef('arguments.themeClearTextColorOption', Language.Default)
        );

        if (!clearPrimary && !clearText) {
            let embed: EmbedBuilder = Lang.getEmbed('displayEmbeds.themeClearNoneSelected', data.lang);
            await InteractionUtils.send(intr, embed);
            return;
        }

        let fieldsToClear: string[] = [];
        let clearedNames: string[] = [];

        if (clearPrimary) {
            fieldsToClear.push('primary_color');
            clearedNames.push('Primary Color');
        }
        if (clearText) {
            fieldsToClear.push('text_color');
            clearedNames.push('Text Color');
        }

        await this.databaseService.clearUserSettingsFields(intr.user.id, intr.guildId, fieldsToClear);

        let embed: EmbedBuilder = Lang.getEmbed('displayEmbeds.themeClearSuccess', data.lang, {
            CLEARED_OPTIONS: clearedNames.join(', '),
        });

        await InteractionUtils.send(intr, embed);
    }
}
