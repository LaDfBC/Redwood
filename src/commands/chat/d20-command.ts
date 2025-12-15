import { ChatInputCommandInteraction, EmbedBuilder, PermissionsString } from 'discord.js';

import { Language } from '../../models/enum-helpers/index.js';
import { EventData } from '../../models/internal-models.js';
import { Lang } from '../../services/index.js';
import { InteractionUtils } from '../../utils/index.js';
import { Command, CommandDeferType } from '../index.js';

export class D20Command implements Command {
    public names = [Lang.getRef('chatCommands.d20', Language.Default)];
    public deferType = CommandDeferType.PUBLIC;
    public requireClientPerms: PermissionsString[] = [];
    public async execute(intr: ChatInputCommandInteraction, data: EventData): Promise<void> {
        let embed: EmbedBuilder = Lang.getEmbed('displayEmbeds.d20Commands', data.lang, {
            ROLL_RESULT: getRandomInt(1, 20).toString(),
            USER: intr.user.displayName,
        });

        await InteractionUtils.send(intr, embed);
    }
}

const getRandomInt = (min: number, max: number): Number => {
    min = Math.ceil(min); // Ensures min is an integer
    max = Math.floor(max); // Ensures max is an integer
    return Math.floor(Math.random() * (max - min + 1)) + min;
}