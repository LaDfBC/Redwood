import {
  ApplicationCommandOptionChoiceData,
  AutocompleteFocusedOption,
  AutocompleteInteraction,
  ChatInputCommandInteraction,
  EmbedBuilder,
  PermissionsString,
  User,
} from "discord.js";

import { Language } from "../../models/enum-helpers/index.js";
import { EventData } from "../../models/internal-models.js";
import { Lang } from "../../services/index.js";
import { InteractionUtils } from "../../utils/index.js";
import { Command, CommandDeferType } from "../index.js";
import { DatabaseService } from "../../services/database-service";
import { CustomCommandRow, CustomCommandUsageRow } from "../../models/database";
import QuickChart from "quickchart-js";
import {CustomClient} from "../../extensions";

export class CcUsageCommand implements Command {
  constructor(
      private databaseService: DatabaseService,
      private client: CustomClient
  ) {}

  public names = [Lang.getRef("chatCommands.cc-usage", Language.Default)];
  public deferType = CommandDeferType.PUBLIC;
  public requireClientPerms: PermissionsString[] = [];
  public async execute(
    intr: ChatInputCommandInteraction,
    data: EventData,
  ): Promise<void> {
    let args: { name: string } = {
      name: intr.options.getString(
        Lang.getRef("arguments.ccUsageNameOption", Language.Default),
      ),
    };

    let embed: EmbedBuilder;

    const possibleCommand: CustomCommandRow | undefined = await this.databaseService.fetchCommand(args.name, intr.guildId);

    if (possibleCommand === undefined) {
      embed = Lang.getEmbed("displayEmbeds.ccUsageNameDoesNotExist", data.lang, {
          COMMAND_NAME: args.name,
        },
      );

      await InteractionUtils.send(intr, embed);
    } else {
      let result: CustomCommandUsageRow[] = await this.databaseService.fetchCommandUsage(args.name, intr.guildId);
      for (let i = 0; i < result.length; i++) {
          result[i].calling_userid = (await this.client.users.fetch(result[i].calling_userid)).displayName
      }

      const lastUsed: string = result.sort((usageRow1, usageRow2) =>
          usageRow1.usage_date.getTime() - usageRow2.usage_date.getTime(),
      )[0].usage_date.toLocaleDateString()

      let playerUsageData = {};
      result.forEach(async (usageRow) => {
          if (playerUsageData[usageRow.calling_userid]) {
              playerUsageData[usageRow.calling_userid] = playerUsageData[usageRow.calling_userid] + 1;
          } else {
              playerUsageData[usageRow.calling_userid] = 1;
          }
      });
      const chartUrl = await this.generateChart(playerUsageData);

      embed = Lang.getEmbed("displayEmbeds.ccUsageSuccess", data.lang, {
          COMMAND_NAME: args.name,
          CREATED_ON: possibleCommand.created.toLocaleDateString(),
          OWNER: (await this.client.users.fetch(possibleCommand.owner_username)).displayName, //TODO: How do we get the username from the id?
          COUNT: result.length.toString(),
          LAST_USED: lastUsed,
          IMAGE_LINK: chartUrl,
      });
      await InteractionUtils.send(intr, embed);
    }
  }

  private async generateChart(summary: object): Promise<string> {
    const labels = Object.keys(summary);
    const chart = new QuickChart();
    chart.setConfig({
      type: "bar",
      data: {
        legend: "options",
        labels,
        datasets: [
          {
            data: labels.map((label) => {
              return summary[label];
            }),
          },
        ],
      },
      options: {
        legend: {
          display: false,
          labels: {
            display: false,
          },
        },
      },
    });
    return await chart.getShortUrl(); // Or chart.getUrl()
  }

  public async autocomplete(intr: AutocompleteInteraction, option: AutocompleteFocusedOption,): Promise<ApplicationCommandOptionChoiceData<string | number>[]> {
    const searchString = option.value;
    const commands: CustomCommandRow[] = await this.databaseService.fetchAllCommandsMatchingString(searchString, intr.guildId);
    return commands.map((command: CustomCommandRow) => {
      return {
        name: command.command_name,
        name_localizations: {
          "en-US": command.command_name,
        },
        value: command.command_name,
      };
    });
  }
}
