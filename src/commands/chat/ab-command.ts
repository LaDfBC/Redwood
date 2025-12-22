import { ChatInputCommandInteraction, EmbedBuilder, PermissionsString } from 'discord.js';

import { Language } from '../../models/enum-helpers/index.js';
import { EventData } from '../../models/internal-models.js';
import {DatabaseService, Lang } from '../../services/index.js';
import { InteractionUtils } from '../../utils/index.js';
import { Command, CommandDeferType } from '../index.js';

export class AtBatCommand implements Command {
    constructor(
        private databaseService: DatabaseService,
    ) {}

    public names = [Lang.getRef('chatCommands.ab', Language.Default)];
    public deferType = CommandDeferType.PUBLIC;
    public requireClientPerms: PermissionsString[] = [];
    public async execute(intr: ChatInputCommandInteraction, data: EventData): Promise<void> {
        const chaosRoll: number = getRandomInt(1, 20)
        await this.databaseService.logChaosRoll(intr.user.id, intr.guildId, chaosRoll);

        if (chaosRoll === 1) { // Wild Pitch
            await InteractionUtils.send(intr, Lang.getEmbed('displayEmbeds.abWildPitchCommand', data.lang, {
                ROLL_RESULT: getRandomInt(1, 20).toString(),
                USER: intr.user.displayName,
                CHAOS_ROLL: chaosRoll.toString(),
            }));
        } else if (chaosRoll === 2) { // Balk or Passed Ball
            const chaosDecisionRoll: number = getRandomInt(1, 6)
            if (chaosDecisionRoll <= 3) { // Balk
                await InteractionUtils.send(intr, Lang.getEmbed('displayEmbeds.abBalkCommand', data.lang, {
                    ROLL_RESULT: getRandomInt(1, 20).toString(),
                    USER: intr.user.displayName,
                    CHAOS_ROLL: chaosRoll.toString(),
                    SECONDARY_CHAOS_ROLL: chaosDecisionRoll.toString(),
                }));
            } else { // Passed Ball
                await InteractionUtils.send(intr, Lang.getEmbed('displayEmbeds.abPassedBallCommand', data.lang, {
                    ROLL_RESULT: getRandomInt(1, 20).toString(),
                    USER: intr.user.displayName,
                    CHAOS_ROLL: chaosRoll.toString(),
                    SECONDARY_CHAOS_ROLL: chaosDecisionRoll.toString(),
                }));
            }
        } else {
            const rollSingle: number = getRandomInt(1, 6);
            const rollOne: number = getRandomInt(1, 6);
            const rollTwo: number = getRandomInt(1, 6);
            const finald20Roll: number = getRandomInt(1, 20);
            const twoD6Total = rollOne + rollTwo;

            await this.databaseService.logAtBatRolls(intr.user.id, intr.guildId, {d6: rollSingle, twod6: [rollOne, rollTwo], d20: finald20Roll})

            let embed: EmbedBuilder = Lang.getEmbed('displayEmbeds.abStandardCommand', data.lang, {
                ROLL_SINGLE: rollSingle.toString(),
                ROLL_RESULT: (rollOne + rollTwo).toString(),
                ROLL_ONE: rollOne.toString(),
                ROLL_TWO: rollTwo.toString(),
                ROLL_TWENTY: finald20Roll.toString(),
                USER: intr.user.displayName,
                CHAOS_ROLL: chaosRoll.toString(),
            });


            if (rollSingle === 6 && twoD6Total > 6) {
                embed.addFields([{
                    name: `Check Injury for pitcher rating ${13 - twoD6Total}`,
                    value: twoD6Total === 9 ? 'Nice, btw' : (twoD6Total === 7 ? "six seven.  You can be cool like the youths now" : "Don't die or anything")
                }])
            }

            await InteractionUtils.send(intr, embed);
        }
    }
}

const getRandomInt = (min: number, max: number): number => {
    min = Math.ceil(min); // Ensures min is an integer
    max = Math.floor(max); // Ensures max is an integer
    return Math.floor(Math.random() * (max - min + 1)) + min;
}