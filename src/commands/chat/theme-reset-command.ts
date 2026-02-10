import { ChatInputCommandInteraction, EmbedBuilder, PermissionsString } from 'discord.js';

import { EventData } from '../../models/internal-models.js';
import { Lang } from '../../services/index.js';
import { InteractionUtils } from '../../utils/index.js';
import { Command, CommandDeferType } from '../index.js';
import { DatabaseService } from '../../services/database-service.js';

export class ThemeResetCommand implements Command {
    constructor(private databaseService: DatabaseService) {}

    public names = ['user-settings', 'theme', 'reset'];
    public deferType = CommandDeferType.PUBLIC;
    public requireClientPerms: PermissionsString[] = [];

    public async execute(intr: ChatInputCommandInteraction, data: EventData): Promise<void> {
        await this.databaseService.deleteUserSettings(intr.user.id, intr.guildId);

        let embed: EmbedBuilder = Lang.getEmbed('displayEmbeds.themeResetSuccess', data.lang);

        await InteractionUtils.send(intr, embed);
    }
}
