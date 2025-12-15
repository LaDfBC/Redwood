import { ChatInputCommandInteraction, EmbedBuilder, PermissionsString } from 'discord.js';

import { Language } from '../../models/enum-helpers/index.js';
import { EventData } from '../../models/internal-models.js';
import { Lang } from '../../services/index.js';
import { InteractionUtils } from '../../utils/index.js';
import { Command, CommandDeferType } from '../index.js';

export class JumpCommand implements Command {
    public names = [Lang.getRef('chatCommands.jump', Language.Default)];
    public deferType = CommandDeferType.PUBLIC;
    public requireClientPerms: PermissionsString[] = [];
    public async execute(intr: ChatInputCommandInteraction, data: EventData): Promise<void> {
        const chaosRoll: number = getRandomInt(1, 20)
        if (chaosRoll === 1) {
            await InteractionUtils.send(intr, Lang.getEmbed('displayEmbeds.jumpPickoffCommand', data.lang, {
                ROLL_RESULT: getRandomInt(1, 20).toString(),
                USER: intr.user.displayName,
                CHAOS_ROLL: chaosRoll.toString(),
            }));
        } else if (chaosRoll === 2) {
            await InteractionUtils.send(intr, Lang.getEmbed('displayEmbeds.jumpBalkCommand', data.lang, {
                ROLL_RESULT: getRandomInt(1, 20).toString(),
                USER: intr.user.displayName,
                CHAOS_ROLL: chaosRoll.toString(),
            }));
        } else {
            const rollOne: number = getRandomInt(1, 6);
            const rollTwo: number = getRandomInt(1, 6);
            let embed: EmbedBuilder = Lang.getEmbed('displayEmbeds.jumpStandardCommand', data.lang, {
                ROLL_RESULT: (rollOne + rollTwo).toString(),
                ROLL_ONE: rollOne.toString(),
                ROLL_TWO: rollTwo.toString(),
                USER: intr.user.displayName,
                CHAOS_ROLL: chaosRoll.toString(),
            });

            await InteractionUtils.send(intr, embed);
        }
    }
}

const getRandomInt = (min: number, max: number): number => {
    min = Math.ceil(min); // Ensures min is an integer
    max = Math.floor(max); // Ensures max is an integer
    return Math.floor(Math.random() * (max - min + 1)) + min;
}