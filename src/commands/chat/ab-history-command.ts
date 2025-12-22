import {
  ChatInputCommandInteraction,
  EmbedBuilder,
  PermissionsString,
} from "discord.js";

import { Language } from "../../models/enum-helpers/index.js";
import { EventData } from "../../models/internal-models.js";
import { Lang } from "../../services/index.js";
import { InteractionUtils } from "../../utils/index.js";
import { Command, CommandDeferType } from "../index.js";
import { DatabaseService } from "../../services/database-service";
import { AbHistoryRow } from "../../models/database";
import { RollType } from "../../enums/index.js";
import QuickChart from "quickchart-js";
import {HistoryStats} from "../../models/command-models";

const summaryBaseline = {
    [RollType.D20]: {1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0, 10: 0, 11:0, 12:0, 13:0, 14:0, 15: 0, 16: 0, 17: 0, 18:0, 19: 0, 20: 0},
    [RollType.TWOD6]: {2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0, 10: 0, 11:0, 12:0},
    [RollType.D6]: {1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0},
    [RollType.CHAOS]: {1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0, 10: 0, 11:0, 12:0, 13:0, 14:0, 15: 0, 16: 0, 17: 0, 18:0, 19: 0, 20: 0},
}

export class AbHistoryCommand implements Command {
  constructor(private databaseService: DatabaseService) {}

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
            const historyRows: AbHistoryRow[] = await this.databaseService.fetchAbHistory(intr.user.id, intr.guildId, RollType[args.roll_type], args.count)
            let summary = structuredClone(summaryBaseline)
            historyRows.forEach((hist: AbHistoryRow) => {
                summary[hist.roll_type][hist.roll_value] = summary[hist.roll_type][hist.roll_value] + 1
            })

      if (rollTypeEnum === RollType.D20 || rollTypeEnum === RollType.ALL) {
          const chartUrl = await this.generateChart(RollType.D20, summary);

          const stats = this.getStats(RollType.D20, summary),
          embed = Lang.getEmbed("displayEmbeds.abHistorySuccess", data.lang, {
              USER: intr.user.username,
              ROLL: 'd20',
              IMAGE_LINK: chartUrl,
              AVERAGE: stats.average,
              COUNT: stats.count.toString()
          });
          await InteractionUtils.send(intr, embed);
      }
      if (rollTypeEnum === RollType.TWOD6 || rollTypeEnum === RollType.ALL) {
          const chartUrl = await this.generateChart(RollType.TWOD6, summary);

          const stats = this.getStats(RollType.TWOD6, summary),
          embed = Lang.getEmbed("displayEmbeds.abHistorySuccess", data.lang, {
              USER: intr.user.username,
              ROLL: '2d6',
              IMAGE_LINK: chartUrl,
              AVERAGE: stats.average,
              COUNT: stats.count.toString()
          });
          await InteractionUtils.send(intr, embed);
      }
      if (rollTypeEnum === RollType.D6 || rollTypeEnum === RollType.ALL) {
          const chartUrl = await this.generateChart(RollType.D6, summary);

          const stats= this.getStats(RollType.D6, summary),
          embed = Lang.getEmbed("displayEmbeds.abHistorySuccess", data.lang, {
              USER: intr.user.username,
              ROLL: 'd6',
              IMAGE_LINK: chartUrl,
              AVERAGE: stats.average,
              COUNT: stats.count.toString()
          });
          await InteractionUtils.send(intr, embed);
      }
      if (rollTypeEnum === RollType.CHAOS) {
          const chartUrl = await this.generateChart(RollType.CHAOS, summary);

          const stats= this.getStats(RollType.CHAOS, summary),
              embed = Lang.getEmbed("displayEmbeds.abHistoryChaos", data.lang, {
              USER: intr.user.username,
              ROLL: ':smiling_imp: chaos',
              IMAGE_LINK: chartUrl,
              AVERAGE: stats.average,
              COUNT: stats.count.toString()
          });
          await InteractionUtils.send(intr, embed);
      }
    }
  }

  private async generateChart (rollType: RollType, summary: object): Promise<string> {
      const labels = Object.keys(summaryBaseline[rollType]);
      const chart = new QuickChart();
      chart.setConfig({
          type: "bar",
          data: {
              legend: 'options',
              labels,
              datasets: [
                  {
                      data: labels.map((label) => {
                          return summary[rollType][label];
                      }),
                  },
              ],
          },
          options: {
              legend: {
                  display: false,
                  labels: {
                      display: false
                  }
              }
          }
      });
      return await chart.getShortUrl(); // Or chart.getUrl()
  }

  private getStats(rollType: RollType, summary: object): HistoryStats {
    let total = 0;
    let count = 0;
    Object.keys(summary[rollType]).forEach((key) => {
      const val = summary[rollType][key];
      if (val !== 0) {
        total += parseInt(key, 10);
        count += val;
      }
    });
    return {
        average:(total / count).toFixed(3),
        count: count
    }
  }
}
