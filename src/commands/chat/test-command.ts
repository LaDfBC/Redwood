import { ChatInputCommandInteraction, PermissionsString } from 'discord.js';
import { RateLimiter } from 'discord.js-rate-limiter';

import { Language } from '../../models/enum-helpers/index.js';
import { EventData } from '../../models/internal-models.js';
import { DatabaseService, Lang } from '../../services/index.js';
import { EmbedUtils, InteractionUtils } from '../../utils/index.js';
import { Command, CommandDeferType } from '../index.js';

export class TestCommand implements Command {
    constructor(private databaseService: DatabaseService) {}

    public names = [Lang.getRef('chatCommands.test', Language.Default)];
    public cooldown = new RateLimiter(1, 5000);
    public deferType = CommandDeferType.PUBLIC;
    public requireClientPerms: PermissionsString[] = [];

    public async execute(intr: ChatInputCommandInteraction, data: EventData): Promise<void> {
        let embed = Lang.getEmbed('displayEmbeds.test', data.lang);
        await EmbedUtils.applyUserTheme(embed, this.databaseService, intr.user.id, intr.guildId);
        await InteractionUtils.send(intr, embed);
    }
}
