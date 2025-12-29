import {
    ChatInputCommandInteraction,
    EmbedBuilder,
    PermissionsString,
    User
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
        let args: { count: number, roll_type: string, additional_user: User } = {
            count: intr.options.getNumber(
                Lang.getRef('arguments.abHistoryCountOption', Language.Default)
            ),
            roll_type: intr.options.getString(
                Lang.getRef('arguments.abHistoryRollTypeOption', Language.Default)
            ),
            additional_user: intr.options.getUser(
                Lang.getRef('arguments.abHistoryAdditionalUserOption', Language.Default)
            )
        };

        if (args.roll_type === '2d6') {
            args.roll_type = 'TWOD6'
        }

        const additionalUser: User = args.additional_user
        const userText = additionalUser ? `${intr.user.displayName} and ${additionalUser.displayName}` : intr.user.displayName;

        let embed: EmbedBuilder;
        let rollTypeEnum: RollType = RollType[args.roll_type];
        if (rollTypeEnum === undefined) {
            embed = Lang.getEmbed('displayEmbeds.abHistoryUnknownRollType', data.lang, {
                BAD_ROLL_TYPE: args.roll_type,
            });
            await InteractionUtils.send(intr, embed);
        }

        if (rollTypeEnum) {
            let summary = []

            if (additionalUser) {
                const originalUserRows: AbHistoryRow[] = await this.databaseService.fetchAbHistory(intr.user.id, intr.guildId, RollType[args.roll_type], args.count);
                const additionalUserRows: AbHistoryRow[] = await this.databaseService.fetchAbHistory(additionalUser.id, intr.guildId, RollType[args.roll_type], args.count);
                const users = [intr.user.id, additionalUser.id];

                summary = [structuredClone(summaryBaseline), structuredClone(summaryBaseline)]
                originalUserRows.forEach((row: AbHistoryRow) => {
                    summary[users.indexOf(intr.user.id)][row.roll_type][row.roll_value] = summary[users.indexOf(intr.user.id)][row.roll_type][row.roll_value] + 1
                })
                additionalUserRows.forEach((row: AbHistoryRow) => {
                    summary[users.indexOf(additionalUser.id)][row.roll_type][row.roll_value] = summary[users.indexOf(additionalUser.id)][row.roll_type][row.roll_value] + 1
                })
            } else {
              const historyRows: AbHistoryRow[] = await this.databaseService.fetchAbHistory(intr.user.id, intr.guildId, RollType[args.roll_type], args.count);
              summary = [structuredClone(summaryBaseline)];
              historyRows.forEach((hist: AbHistoryRow) => {
                  summary[0][hist.roll_type][hist.roll_value] = summary[0][hist.roll_type][hist.roll_value] + 1;
              });
            }

            if (rollTypeEnum === RollType.D20 || rollTypeEnum === RollType.ALL) {
                const chartUrl = await this.generateChart(RollType.D20, summary, additionalUser ? [intr.user.displayName, additionalUser.displayName] : undefined);

                const stats = this.getStats(RollType.D20, summary);
                embed = Lang.getEmbed(
                    "displayEmbeds.abHistorySuccess",
                    data.lang,
                    {
                      USER: userText,
                      ROLL: "d20",
                      IMAGE_LINK: chartUrl,
                      COUNT: additionalUser ? this.getCountText(stats, [intr.user.displayName, additionalUser.displayName]) : this.getCountText(stats, [intr.user.displayName]),
                    },
                  );
                await InteractionUtils.send(intr, embed);
            }
            if (rollTypeEnum === RollType.TWOD6 || rollTypeEnum === RollType.ALL) {
                const chartUrl = await this.generateChart(RollType.TWOD6, summary, additionalUser ? [intr.user.displayName, additionalUser.displayName] : undefined);

                const stats = this.getStats(RollType.TWOD6, summary)
                embed = Lang.getEmbed(
                    "displayEmbeds.abHistorySuccess",
                    data.lang,
                    {
                      USER: userText,
                      ROLL: "2d6",
                      IMAGE_LINK: chartUrl,
                      COUNT: additionalUser ? this.getCountText(stats, [intr.user.displayName, additionalUser.displayName]) : this.getCountText(stats, [intr.user.displayName]),
                    },
                  );
                await InteractionUtils.send(intr, embed);
            }
            if (rollTypeEnum === RollType.D6 || rollTypeEnum === RollType.ALL) {
                const chartUrl = await this.generateChart(RollType.D6, summary, additionalUser ? [intr.user.displayName, additionalUser.displayName] : undefined);

                const stats = this.getStats(RollType.D6, summary)
                embed = Lang.getEmbed(
                    "displayEmbeds.abHistorySuccess",
                    data.lang,
                    {
                      USER: userText,
                      ROLL: "d6",
                      IMAGE_LINK: chartUrl,
                      COUNT: additionalUser ? this.getCountText(stats, [intr.user.displayName, additionalUser.displayName]) : this.getCountText(stats, [intr.user.displayName]),
                    },
                  );
                await InteractionUtils.send(intr, embed);
            }
            if (rollTypeEnum === RollType.CHAOS) {
                const chartUrl = await this.generateChart(RollType.CHAOS, summary, additionalUser ? [intr.user.displayName, additionalUser.displayName] : undefined);

                const stats = this.getStats(RollType.CHAOS, summary)
                embed = Lang.getEmbed("displayEmbeds.abHistoryChaos", data.lang, {
                    USER: userText,
                    ROLL: ":smiling_imp: chaos",
                    IMAGE_LINK: chartUrl,
                    COUNT: additionalUser ? this.getCountText(stats, [intr.user.displayName, additionalUser.displayName]) : this.getCountText(stats, [intr.user.displayName]),
                  });
                await InteractionUtils.send(intr, embed);
            }
        }
  }

  private async generateChart (rollType: RollType, summary: object[], usernames?: string[]): Promise<string> {
      const labels = Object.keys(summaryBaseline[rollType]);
      const chart = new QuickChart();
      chart.setConfig({
          type: "bar",
          data: {
              legend: 'options',
              labels,
              datasets: summary.map((currentUserSummary, idx) => {
                  if (usernames) {
                    return {
                      label: usernames[idx],
                      data: labels.map((label) => {
                        return currentUserSummary[rollType][label];
                      }),
                    };
                  } else {
                      return {
                          data: labels.map((label) => {
                            return currentUserSummary[rollType][label];
                          }),
                      };
                  }
              })
          },
          options: {
              legend: {
                  display: (!!usernames),
                  labels: {
                      display: (!!usernames)
                  }
              }
          }
      });

      return await chart.getShortUrl(); // Or chart.getUrl()
  }

    private getStats(rollType: RollType, summaries: object[]): HistoryStats[] {
        return summaries.map((summary) => {
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
                count: count
            }
        })
    }

    private getCountText(stats: HistoryStats[], usernames: string[]): string {
        const longestUsername = Math.max(...usernames.map((username) => username.length))

        let ret = "```js\n"
        if (usernames.length !== stats.length) {
            throw new Error("Unequal username and stat length: Fix this spaghetti code")
        }

        for (let i = 0; i < stats.length; i++) {
            ret += `${usernames[i]}: `
            for (let j = 0; j < (longestUsername - usernames[i].length); j++) {
                ret += ' '
            }
            ret += stats[i].count
            ret += "\n"
        }

        ret += "```"
        return ret;
    }
}
