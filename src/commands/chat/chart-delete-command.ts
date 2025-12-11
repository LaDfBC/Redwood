import {
    ApplicationCommandOptionChoiceData,
    AutocompleteFocusedOption,
    AutocompleteInteraction,
    ChatInputCommandInteraction,
    EmbedBuilder,
    PermissionsString,
} from "discord.js";

import {Language} from '../../models/enum-helpers/index.js';
import {EventData} from '../../models/internal-models.js';
import {Lang} from '../../services/index.js';
import {InteractionUtils} from '../../utils/index.js';
import {Command, CommandDeferType} from '../index.js';
import {DatabaseService} from "../../services/database-service";
import {
  ChartRow,
  CustomCommandRow,
  DeleteChartResult,
  DeleteCommandResult,
} from "../../models/database";
import {
  DeleteChartFailureReason,
  DeleteCommandFailureReason,
} from "../../enums/index.js";

export class ChartDeleteCommand implements Command {
    constructor(
        private databaseService: DatabaseService,
    ) {}

    public names = [Lang.getRef('chatCommands.chart-delete', Language.Default)];
    public deferType = CommandDeferType.HIDDEN;
    public requireClientPerms: PermissionsString[] = [];
    public async execute(intr: ChatInputCommandInteraction, data: EventData): Promise<void> {
        let args: { name: string } = {
            name: intr.options.getString(
                Lang.getRef('arguments.chartDeleteNameOption', Language.Default)
            )
        };

        let embed: EmbedBuilder;
        const result: DeleteChartResult = await this.databaseService.deleteChart(args.name, intr.user.username, intr.guildId)
        if (result.success) {
            embed = Lang.getEmbed('displayEmbeds.chartDeleteCommandSuccessful', data.lang, {
                CHART_NAME: args.name
            })
        } else {
            switch (result.reason) {
                case DeleteChartFailureReason.CHART_DOES_NOT_EXIST:
                    embed = Lang.getEmbed('displayEmbeds.chartDeleteNameDoesNotExist', data.lang, {
                        CHART_NAME: args.name
                    })
                    break;
                case DeleteChartFailureReason.USER_NOT_OWNER:
                    embed = Lang.getEmbed('displayEmbeds.chartDeleteUserNotOwner', data.lang, {
                        CHART_NAME: args.name,
                        USER_NAME: intr.user.username
                    })
                    break;
                case DeleteChartFailureReason.UNKNOWN:
                    embed = Lang.getEmbed('displayEmbeds.chartDeleteUnknownError', data.lang, {
                        CHART_NAME: args.name
                    })
                    break;
                default:
                    embed = Lang.getEmbed('displayEmbeds.chartDeleteUnknownReason', data.lang, {
                        CHART_NAME: args.name
                    })
                    break;
            }
        }

        await InteractionUtils.send(intr, embed);
    }

    public async autocomplete(intr: AutocompleteInteraction, option: AutocompleteFocusedOption): Promise<ApplicationCommandOptionChoiceData<string | number>[]> {
        const searchString = option.value
        const charts: ChartRow[] = await this.databaseService.fetchAllChartsMatchingString(searchString, intr.guildId);
        return charts.map((chart: ChartRow) => {
            return {
                name: chart.chart_name,
                name_localizations: {
                    "en-US": chart.chart_name,
                },
                value: chart.chart_name,
            };
        })
    }
}
