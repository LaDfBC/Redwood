import {ChatInputCommandInteraction, EmbedBuilder, PermissionsString} from 'discord.js';

import {Language} from '../../models/enum-helpers/index.js';
import {EventData} from '../../models/internal-models.js';
import {Lang} from '../../services/index.js';
import {InteractionUtils} from '../../utils/index.js';
import {Command, CommandDeferType} from '../index.js';
import {DatabaseService} from "../../services/database-service";
import {AbHistoryRow} from "../../models/database";
import {RollType} from "../../enums/index.js";

const summaryBaseline = {
    [RollType.D20]: {1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0, 10: 0, 11:0, 12:0, 13:0, 14:0, 15: 0, 16: 0, 17: 0, 18:0, 19: 0, 20: 0},
    [RollType.TWOD6]: {2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0, 10: 0, 11:0, 12:0},
    [RollType.D6]: {1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0},
    [RollType.CHAOS]: {1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0, 10: 0, 11:0, 12:0, 13:0, 14:0, 15: 0, 16: 0, 17: 0, 18:0, 19: 0, 20: 0},
}

export class AbHistoryCommand implements Command {
    constructor(
        private databaseService: DatabaseService,
    ) {}

    public names = [Lang.getRef('chatCommands.ab-history', Language.Default)];
    public deferType = CommandDeferType.PUBLIC;
    public requireClientPerms: PermissionsString[] = [];
    public async execute(intr: ChatInputCommandInteraction, data: EventData): Promise<void> {
        let args: { count: number, roll_type: string } = {
            count: intr.options.getNumber(
                Lang.getRef('arguments.abHistoryCountOption', Language.Default)
            ),
            roll_type: intr.options.getString(
                Lang.getRef('arguments.abHistoryRollTypeOption', Language.Default)
            )
        };

        if (args.roll_type === '2d6') {
            args.roll_type = 'TWOD6'
        }

        let embed: EmbedBuilder;
        let rollTypeEnum: RollType = RollType[args.roll_type];
        if (rollTypeEnum === undefined) {
            embed = Lang.getEmbed('displayEmbeds.abHistoryUnknownRollType', data.lang, {
                BAD_ROLL_TYPE: args.roll_type,
            });
            await InteractionUtils.send(intr, embed);
        }
        
        if (rollTypeEnum) {
            const historyRows: AbHistoryRow[] = await this.databaseService.fetchAbHistory(intr.user.username, intr.guildId, RollType[args.roll_type], args.count)
            let summary = structuredClone(summaryBaseline)
            historyRows.forEach((hist: AbHistoryRow) => {
                summary[hist.roll_type][hist.roll_value] = summary[hist.roll_type][hist.roll_value] + 1
            })


            let fields = []
            if (rollTypeEnum === RollType.D20 || rollTypeEnum === RollType.ALL) {
                fields.push({
                    name: 'd20 Statistics',
                    value: this.formatHistoryResult(RollType.D20, summary) + (RollType.ALL ? '\n-----' : ''),
                });
            }
            if (rollTypeEnum === RollType.TWOD6 || rollTypeEnum === RollType.ALL) {
                fields.push({
                    name: '2d6 Statistics',
                    value: this.formatHistoryResult(RollType.TWOD6, summary) + (RollType.ALL ? '\n-----' : ''),
                });
            }
            if (rollTypeEnum === RollType.D6 || rollTypeEnum === RollType.ALL) {
                fields.push({
                    name: 'd6 Statistics',
                    value: this.formatHistoryResult(RollType.D6, summary),
                });
            }
            if (rollTypeEnum === RollType.CHAOS) {
                fields.push({
                    name: ':imp: Chaos Roll Statistics',
                    value: this.formatHistoryResult(RollType.CHAOS, summary),
                });
            }

            embed = Lang.getEmbed('displayEmbeds.abHistorySuccess', data.lang, {
                USER: intr.user.username,
            })
            embed.addFields(fields)

            await InteractionUtils.send(intr, embed);
        }
    }

    private formatHistoryResult(rollType: RollType, summary: object): string {
        let keyRow = ''
        let valueRow = ''
        let total = 0
        let count = 0
        let first = true
        Object.keys(summary[rollType]).forEach((key) => {
            if ((rollType === RollType.D20 || rollType === RollType.CHAOS) && parseInt(key, 10) % 8 === 0) {
                keyRow += '\n'
                valueRow += '\n'
            }

            const val = summary[rollType][key]
            if (val !== 0) {
              total += parseInt(key, 10);
              count += val;
            }
            const valDigitCount = val.toString().length;
            const keyDigitCount = key.toString().length;
            if (valDigitCount === keyDigitCount) {
                keyRow += (first ? '' : '|') + ` ${key} `
                valueRow += (first ? '' : '|') + ` ${val} `
            }
            else if (valDigitCount > keyDigitCount) {
                const middle: number = Math.ceil(valDigitCount / 2)
                keyRow += (first ? '' : '|') + ' '.repeat(1 + middle - (valDigitCount - keyDigitCount)) + key + ' '.repeat(1 + valDigitCount - middle)
                valueRow += `${first ? '' : '|'} ${val} `
            } else { // key > val or equal
                const middle: number = Math.ceil(keyDigitCount / 2)
                keyRow += (first ? '' : '|') + ' '.repeat(1 + middle - (keyDigitCount - valDigitCount)) + key + ' '.repeat(1 + keyDigitCount - middle)
                valueRow += `${first ? '' : '|'} ${val} `
            }

            first = false
        })
        keyRow += '\n'
        valueRow += '\n'
        return '```js\n' + keyRow  + '-'.repeat(Math.max(...(keyRow.split('\n').map(row => row.length)))) + '\n' + valueRow +  '```\n' +`**Average**: ${(total / count).toFixed(4)}\n`
    }
}
