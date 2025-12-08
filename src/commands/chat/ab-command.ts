import { ChatInputCommandInteraction, EmbedBuilder, PermissionsString } from 'discord.js';

import { Language } from '../../models/enum-helpers/index.js';
import { EventData } from '../../models/internal-models.js';
import { Lang } from '../../services/index.js';
import { InteractionUtils } from '../../utils/index.js';
import { Command, CommandDeferType } from '../index.js';

export class AtBatCommand implements Command {
    public names = [Lang.getRef('chatCommands.ab', Language.Default)];
    public deferType = CommandDeferType.HIDDEN;
    public requireClientPerms: PermissionsString[] = [];
    public async execute(intr: ChatInputCommandInteraction, data: EventData): Promise<void> {
        const chaosRoll: number = getRandomInt(1, 20)
        if (chaosRoll === 1) { // Wild Pitch
            await InteractionUtils.send(intr, Lang.getEmbed('displayEmbeds.abWildPitchCommand', data.lang, {
                ROLL_RESULT: getRandomInt(1, 20).toString(),
                USER: intr.user.displayName,
            }));
        } else if (chaosRoll === 2) { // Balk or Passed Ball
            const chaosDecisionRoll: number = getRandomInt(1, 6)
            if (chaosDecisionRoll <= 3) { // Balk
                await InteractionUtils.send(intr, Lang.getEmbed('displayEmbeds.abBalkCommand', data.lang, {
                    ROLL_RESULT: getRandomInt(1, 20).toString(),
                    USER: intr.user.displayName,
                }));
            } else { // Passed Ball
                await InteractionUtils.send(intr, Lang.getEmbed('displayEmbeds.abPassedBallCommand', data.lang, {
                    ROLL_RESULT: getRandomInt(1, 20).toString(),
                    USER: intr.user.displayName,
                }));
            }
        } else {
            const rollSingle: number = getRandomInt(1, 6);
            const rollOne: number = getRandomInt(1, 6);
            const rollTwo: number = getRandomInt(1, 6);
            const finald20Roll: number = getRandomInt(1, 20);
            let embed: EmbedBuilder = Lang.getEmbed('displayEmbeds.abStandardCommand', data.lang, {
                ROLL_SINGLE: rollSingle.toString(),
                ROLL_RESULT: (rollOne + rollTwo).toString(),
                ROLL_ONE: rollOne.toString(),
                ROLL_TWO: rollTwo.toString(),
                ROLL_TWENTY: finald20Roll.toString(),
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