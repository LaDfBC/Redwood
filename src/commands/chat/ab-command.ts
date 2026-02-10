import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ChatInputCommandInteraction,
    ColorResolvable,
    EmbedBuilder,
    Locale,
    PermissionsString
} from 'discord.js';

import { Language } from '../../models/enum-helpers/index.js';
import { EventData } from '../../models/internal-models.js';
import { DatabaseService, Lang } from '../../services/index.js';
import { InteractionUtils } from '../../utils/index.js';
import { Command, CommandDeferType } from '../index.js';

// Exported helper function for random integers
export const getRandomInt = (min: number, max: number): number => {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
};

// Reusable at-bat execution logic
export async function executeAtBat(
    databaseService: DatabaseService,
    userId: string,
    guildId: string,
    displayName: string,
    lang: Locale
): Promise<{ embed: EmbedBuilder }> {
    const chaosRoll: number = getRandomInt(1, 20);
    await databaseService.logChaosRoll(userId, guildId, chaosRoll);

    let embed: EmbedBuilder;

    if (chaosRoll === 1) { // Wild Pitch
        embed = Lang.getEmbed('displayEmbeds.abWildPitchCommand', lang, {
            ROLL_RESULT: getRandomInt(1, 20).toString(),
            USER: displayName,
            CHAOS_ROLL: chaosRoll.toString(),
        });
    } else if (chaosRoll === 2) { // Balk or Passed Ball
        const chaosDecisionRoll: number = getRandomInt(1, 6);
        if (chaosDecisionRoll <= 3) { // Balk
            embed = Lang.getEmbed('displayEmbeds.abBalkCommand', lang, {
                ROLL_RESULT: getRandomInt(1, 20).toString(),
                USER: displayName,
                CHAOS_ROLL: chaosRoll.toString(),
                SECONDARY_CHAOS_ROLL: chaosDecisionRoll.toString(),
            });
        } else { // Passed Ball
            embed = Lang.getEmbed('displayEmbeds.abPassedBallCommand', lang, {
                ROLL_RESULT: getRandomInt(1, 20).toString(),
                USER: displayName,
                CHAOS_ROLL: chaosRoll.toString(),
                SECONDARY_CHAOS_ROLL: chaosDecisionRoll.toString(),
            });
        }
    } else {
        const rollSingle: number = getRandomInt(1, 6);
        const rollOne: number = getRandomInt(1, 6);
        const rollTwo: number = getRandomInt(1, 6);
        const finald20Roll: number = getRandomInt(1, 20);
        const twoD6Total = rollOne + rollTwo;

        await databaseService.logAtBatRolls(userId, guildId, {
            d6: rollSingle,
            twod6: [rollOne, rollTwo],
            d20: finald20Roll
        });

        embed = Lang.getEmbed('displayEmbeds.abStandardCommand', lang, {
            ROLL_SINGLE: rollSingle.toString(),
            ROLL_RESULT: (rollOne + rollTwo).toString(),
            ROLL_ONE: rollOne.toString(),
            ROLL_TWO: rollTwo.toString(),
            ROLL_TWENTY: finald20Roll.toString(),
            USER: displayName,
            CHAOS_ROLL: chaosRoll.toString(),
        });

        // Apply user's custom theme color if set
        const userSettings = await databaseService.fetchUserSettings(userId, guildId);
        if (userSettings?.primary_color) {
            embed.setColor(userSettings.primary_color as ColorResolvable);
        }

        if (rollSingle === 6 && twoD6Total > 6) {
            embed.addFields([{
                name: `Check Injury for pitcher rating ${13 - twoD6Total}`,
                value: twoD6Total === 9 ? 'Nice, btw' : (twoD6Total === 7 ? 'six seven.  You can be cool like the youths now' : 'Don\'t die or anything')
            }]);
        }
    }

    return { embed };
}

// Helper to create the repeat button row
export function createRepeatButtonRow(): ActionRowBuilder<ButtonBuilder> {
    return new ActionRowBuilder<ButtonBuilder>()
        .setComponents([
            new ButtonBuilder({
                customId: 'abRepeatButton',
                style: ButtonStyle.Secondary,
                label: 'Repeat',
                emoji: '🔄'
            })
        ]);
}

export class AtBatCommand implements Command {
    constructor(
        private databaseService: DatabaseService,
    ) {}

    public names = [Lang.getRef('chatCommands.ab', Language.Default)];
    public deferType = CommandDeferType.PUBLIC;
    public requireClientPerms: PermissionsString[] = [];

    public async execute(intr: ChatInputCommandInteraction, data: EventData): Promise<void> {
        const result = await executeAtBat(
            this.databaseService,
            intr.user.id,
            intr.guildId,
            intr.user.displayName,
            data.lang
        );

        await InteractionUtils.send(intr, {
            embeds: [result.embed],
            components: [createRepeatButtonRow()]
        });
    }
}