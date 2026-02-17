import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ChatInputCommandInteraction,
    EmbedBuilder,
    Locale,
    PermissionsString,
} from 'discord.js';

import { Language } from '../../models/enum-helpers/index.js';
import { EventData } from '../../models/internal-models.js';
import { DatabaseService, Lang } from '../../services/index.js';
import { EmbedUtils, InteractionUtils } from '../../utils/index.js';
import { Command, CommandDeferType } from '../index.js';
import { getRandomInt } from './ab-command.js';

export function executeRoll(
    numDice: number,
    numSides: number,
    lang: Locale
): { embed: EmbedBuilder } {
    const rolls: number[] = [];
    for (let i = 0; i < numDice; i++) {
        rolls.push(getRandomInt(1, numSides) as number);
    }
    const total = rolls.reduce((sum, r) => sum + r, 0);

    let embed: EmbedBuilder = Lang.getEmbed('displayEmbeds.rollCommand', lang, {
        DICE_NOTATION: `${numDice}d${numSides}`,
        ROLLS: rolls.join(', '),
        ROLL_NAME: rolls.length === 1 ? 'Roll' : 'Rolls',
        TOTAL: total.toString(),
    });

    return { embed };
}

export function createRollRepeatButtonRow(): ActionRowBuilder<ButtonBuilder> {
    return new ActionRowBuilder<ButtonBuilder>()
        .setComponents([
            new ButtonBuilder({
                customId: 'rollRepeatButton',
                style: ButtonStyle.Secondary,
                label: 'Repeat',
                emoji: '🔄'
            })
        ]);
}

export class RollCommand implements Command {
    constructor(private databaseService: DatabaseService) {}

    public names = [Lang.getRef('chatCommands.roll', Language.Default)];
    public deferType = CommandDeferType.PUBLIC;
    public requireClientPerms: PermissionsString[] = [];

    public async execute(intr: ChatInputCommandInteraction, data: EventData): Promise<void> {
        const diceInput = intr.options.getString('dice');

        const match = diceInput?.match(/^(\d+)d(\d+)$/i);
        if (!match) {
            let embed: EmbedBuilder = Lang.getEmbed('validationEmbeds.rollInvalidFormat', data.lang);
            await InteractionUtils.send(intr, embed);
            return;
        }

        const numDice = parseInt(match[1], 10);
        const numSides = parseInt(match[2], 10);

        if (numDice <= 0 || numDice > 1000 || numSides <= 0 || numSides > 1000) {
            let embed: EmbedBuilder = Lang.getEmbed('validationEmbeds.rollOutOfRange', data.lang);
            await InteractionUtils.send(intr, embed);
            return;
        }

        const { embed } = executeRoll(numDice, numSides, data.lang);
        await EmbedUtils.applyUserTheme(embed, this.databaseService, intr.user.id, intr.guildId);

        await InteractionUtils.send(intr, {
            embeds: [embed],
            components: [createRollRepeatButtonRow()],
        });
    }
}
