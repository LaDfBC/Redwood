import { ChatInputCommandInteraction, EmbedBuilder, PermissionsString, ShardingManager} from 'discord.js';

import { Language } from '../../models/enum-helpers/index.js';
import { EventData } from '../../models/internal-models.js';
import { Lang } from '../../services/index.js';
import { InteractionUtils } from '../../utils/index.js';
import { Command, CommandDeferType } from '../index.js';
import { DatabaseService } from "../../services/database-service";

export class ChartCreateCommand implements Command {
    constructor(
        private databaseService: DatabaseService,
    ) {}

    public names = [Lang.getRef('chatCommands.chart-create', Language.Default)];
    public deferType = CommandDeferType.HIDDEN;
    public requireClientPerms: PermissionsString[] = [];
    public async execute(intr: ChatInputCommandInteraction, data: EventData): Promise<void> {
        let args: { name: string, title: string, description: string, imageLink; string } = {
            name: intr.options.getString(
                Lang.getRef('arguments.chartCreateNameOption', Language.Default)
            ),
            title: intr.options.getString(
                Lang.getRef('arguments.chartCreateTitleOption', Language.Default)
            ),
            description: intr.options.getString(
                Lang.getRef('arguments.chartCreateDescriptionOption', Language.Default)
            ),
            imageLink: intr.options.getString(
                Lang.getRef('arguments.chartCreateImageLinkOption', Language.Default)
            )
        };

        let embed: EmbedBuilder;
        if (await this.databaseService.commandExists(args.name, intr.guildId)) {
            embed = Lang.getEmbed('displayEmbeds.chartCreateCommandNameAlreadyExists', data.lang, {
                //TODO: Get the username of the already-existing command so that we can show a better display message.
                COMMAND_NAME: args.name
            });
        } else {
            await this.databaseService.insertChart(args.name, intr.user.username, intr.guildId, args.action)
            embed = Lang.getEmbed('displayEmbeds.chartCreateCommandSuccessful', data.lang, {
                COMMAND_NAME: args.name
            })
        }

        await InteractionUtils.send(intr, embed);
    }
}
