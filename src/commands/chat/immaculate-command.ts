import { ChatInputCommandInteraction, EmbedBuilder, PermissionsString } from 'discord.js';

import { Language } from '../../models/enum-helpers/index.js';
import { EventData } from '../../models/internal-models.js';
import { DatabaseService, Lang } from '../../services/index.js';
import { EmbedUtils, InteractionUtils } from '../../utils/index.js';
import { Command, CommandDeferType } from '../index.js';
import { getRandomInt } from './ab-command.js';

export class ImmaculateCommand implements Command {
    constructor(private databaseService: DatabaseService) {}

    public names = [Lang.getRef('chatCommands.immaculate', Language.Default)];
    public deferType = CommandDeferType.PUBLIC;
    public requireClientPerms: PermissionsString[] = [];

    public async execute(intr: ChatInputCommandInteraction, data: EventData): Promise<void> {
        const roll = getRandomInt(1, 283) as number;

        let embed: EmbedBuilder;
        if (roll === 69) {
            embed = Lang.getEmbed('displayEmbeds.immaculateCelebration', data.lang);
            await EmbedUtils.applyUserTheme(embed, this.databaseService, intr.user.id, intr.guildId);
            await InteractionUtils.send(intr, embed);
            await InteractionUtils.send(intr, "I'M DOING IT AGAIN BECAUSE IT. IS. TIME. TO. PARTY!")
        } else {
            embed = Lang.getEmbed('displayEmbeds.immaculateCommand', data.lang, {
                ROLL: roll.toString(),
                TOTAL: roll.toString(),
            });
            await EmbedUtils.applyUserTheme(embed, this.databaseService, intr.user.id, intr.guildId);
        }

        await InteractionUtils.send(intr, embed);
    }
}
