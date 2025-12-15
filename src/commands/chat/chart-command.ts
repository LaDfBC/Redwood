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
import { ChartRow } from "../../models/database";

export class ChartFetchCommand implements Command {
    constructor(
        private databaseService: DatabaseService,
    ) {}

    public names = [Lang.getRef('chatCommands.chart-fetch', Language.Default)];
    public deferType = CommandDeferType.PUBLIC;
    public requireClientPerms: PermissionsString[] = [];
    public async execute(intr: ChatInputCommandInteraction, data: EventData): Promise<void> {
        let args: { name: string } = {
            name: intr.options.getString(
                Lang.getRef('arguments.chartFetchNameOption', Language.Default)
            )
        };

        let embed: EmbedBuilder;

        const result: ChartRow | undefined = await this.databaseService.fetchChart(args.name, intr.guildId)
        if (result === undefined) {
            embed = Lang.getEmbed('displayEmbeds.chartNameDoesNotExist', data.lang, {
                CHART_NAME: args.name
            })

            await InteractionUtils.send(intr, embed);
        } else { //Success!
            let embed: EmbedBuilder;
            embed = Lang.getEmbed('displayEmbeds.chartFetchSuccess', data.lang, {
                CHART_NAME: args.name,
                TITLE: result.title,
                DESCRIPTION: result.description,
                IMAGE_LINK: result.image_link
            });

            await InteractionUtils.send(intr, embed);
        }
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
