import { ChatInputCommandInteraction, EmbedBuilder, PermissionsString } from 'discord.js';

import { Language } from '../../models/enum-helpers/index.js';
import { EventData } from '../../models/internal-models.js';
import { DatabaseService, Lang } from '../../services/index.js';
import { EmbedUtils, InteractionUtils } from '../../utils/index.js';
import { Command, CommandDeferType } from '../index.js';

export class SetGameContextCommand implements Command {
    constructor(private databaseService: DatabaseService) {}

    public names = [Lang.getRef('chatCommands.set-game-context', Language.Default)];
    public deferType = CommandDeferType.PUBLIC;
    public requireClientPerms: PermissionsString[] = [];

    public async execute(intr: ChatInputCommandInteraction, data: EventData): Promise<void> {
        const sheetLink = intr.options.getString(
            Lang.getRef('arguments.setGameContextLink', Language.Default),
            true
        );
        const serverId = intr.guildId;
        const channelId = intr.channelId;

        await this.databaseService.upsertGameContext(serverId, channelId, sheetLink);

        let embed: EmbedBuilder = Lang.getEmbed('displayEmbeds.setGameContextSuccess', data.lang, {
            SHEET_LINK: sheetLink,
        });
        await EmbedUtils.applyUserTheme(embed, this.databaseService, intr.user.id, intr.guildId);
        await InteractionUtils.send(intr, embed);
    }
}
