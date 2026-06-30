import { ChatInputCommandInteraction, EmbedBuilder, Locale, PermissionsString } from 'discord.js';

import { Language } from '../../models/enum-helpers/index.js';
import { EventData } from '../../models/internal-models.js';
import { DatabaseService, Lang } from "../../services/index.js";
import { EmbedUtils, InteractionUtils } from '../../utils/index.js';
import { Command, CommandDeferType } from '../index.js';
import {FieldingErrorRow, FieldingRangeRow} from "../../models/database";

// Hit outcomes that should render blue in the Range Result (trailing '#' is ignored when matching).
const BLUE_VALUES: Set<string> = new Set(['SI1', 'SI2', 'DO2', 'DO3', 'T']);
// ANSI escape codes for Discord ```ansi code blocks: blue text (34) and reset (0). Mirrors ab-command.ts.
const ANSI_BLUE = '[34m';
const ANSI_RESET = '[0m';

export async function executeFielding(
    databaseService: DatabaseService,
    userId: string,
    guildId: string,
    displayName: string,
    position: string,
    lang: Locale
): Promise<{ embed: EmbedBuilder }> {
    const rangeRoll: number = getRandomInt(1, 20)
    const errorRoll1: number = getRandomInt(1, 6);
    const errorRoll2: number = getRandomInt(1, 6);
    const errorRoll3: number = getRandomInt(1, 6);
    const errorRollTotal = errorRoll1 + errorRoll2 + errorRoll3;

    const rangeData: FieldingRangeRow = await databaseService.fetchFieldingRange(position, rangeRoll);
    // We are assuming 5 numbers here as per the current requirements. If this changes we can generify it without too much hassle
    const rangeValuesFormatted: string = rangeData.values.replaceAll(',', ' | ')
    const rangeValuesSplit = rangeValuesFormatted.split(' | ')
    const rangeNumbersFormatted: string = ['1', '2', '3', '4', '5']
        .map((rangeNum: string, index: number) => {
            const charactersInVal = rangeValuesSplit[index].length + 2
            const middle: number = Math.ceil(charactersInVal / 2)
            return ' '.repeat(middle - 1) + rangeNum + ' '.repeat(charactersInVal - middle)
        })
        .join('|')
        .slice(1)

    // Hit outcomes are colored blue via ANSI codes (the Range Result uses an ```ansi block).
    // ANSI codes are zero-width on screen, so the number row above still lines up with the plain widths.
    const rangeValuesColored: string = rangeValuesSplit
        .map((value: string) => (BLUE_VALUES.has(value.replace('#', '')) ? `${ANSI_BLUE}${value}${ANSI_RESET}` : value))
        .join(' | ')

    const errorData = await databaseService.fetchFieldingErrorData(position, errorRollTotal)
    const errorBaseCountMap = errorData.reduce((acc: any, row: FieldingErrorRow) => {
        if (row.value) {
            acc[row.value].push(row.e_rating)
        }
        return acc
    }, { E1: [], E2: [], E3: []})

    // This could be generified into a function for ANY number of bases.
    // However, last I checked, baseball only has 4 and giving up a 4-base error is called a "Home Run" so this is cleaner imo
    let errorText: string = ''
    if (errorBaseCountMap.E1.length === 0 && errorBaseCountMap.E2.length === 0 && errorBaseCountMap.E3.length === 0) {
        errorText = "*<No error numbers>*"
    }
    errorText = errorText + (errorBaseCountMap.E1.length > 0 ? `1-base: ${errorBaseCountMap.E1.join(' | ')}` : '')
    errorText = errorText + (errorBaseCountMap.E2.length > 0 ? `\n2-base: ${errorBaseCountMap.E2.join(' | ')}` : '')
    errorText = errorText + (errorBaseCountMap.E3.length > 0 ? `\n3-base: ${errorBaseCountMap.E3.join(' | ')}` : '')

    const embed = Lang.getEmbed('displayEmbeds.fielding', lang, {
        RANGE_ROLL: rangeRoll.toString(),
        ERROR_ROLL_1: errorRoll1.toString(),
        ERROR_ROLL_2: errorRoll2.toString(),
        ERROR_ROLL_3: errorRoll3.toString(),
        ERROR_ROLL_TOTAL: errorRollTotal.toString(),
        POSITION: position,
        RANGE_NUMBERS: rangeNumbersFormatted,
        RANGE_TEXT: rangeValuesColored,
        ERROR_TEXT: errorText,
        USER: displayName
    });

    const EMBED_WIDTH = 50;
    if (embed.data.fields) {
        embed.setFields(
            embed.data.fields.map(field => ({
                ...field,
                value: field.value.replace(
                    /```(\w*)\n([\s\S]*?)```/g,
                    (_match, lang, content) => {
                        const padded = content
                            .split('\n')
                            .map((line: string) => line.padEnd(EMBED_WIDTH))
                            .join('\n');
                        return `\`\`\`${lang}\n${padded}\`\`\``;
                    }
                )
            }))
        );
    }

    await EmbedUtils.applyUserTheme(embed, databaseService, userId, guildId);
    return { embed };
}

export class FieldingCommand implements Command {
    constructor(
        private databaseService: DatabaseService,
    ) {}

    public names = [Lang.getRef('chatCommands.fielding', Language.Default)];
    public deferType = CommandDeferType.PUBLIC;
    public requireClientPerms: PermissionsString[] = [];
    public async execute(intr: ChatInputCommandInteraction, data: EventData): Promise<void> {
        const position = intr.options.getString(
            Lang.getRef('arguments.fieldingPositionOption', Language.Default)
        );
        const result = await executeFielding(
            this.databaseService,
            intr.user.id,
            intr.guildId,
            intr.user.displayName,
            position,
            data.lang
        );
        await InteractionUtils.send(intr, result.embed);
    }
}

const getRandomInt = (min: number, max: number): number => {
    min = Math.ceil(min); // Ensures min is an integer
    max = Math.floor(max); // Ensures max is an integer
    return Math.floor(Math.random() * (max - min + 1)) + min;
}