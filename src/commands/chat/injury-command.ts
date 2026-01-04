import { ChatInputCommandInteraction, EmbedBuilder, PermissionsString } from 'discord.js';

import { Language } from '../../models/enum-helpers/index.js';
import { EventData } from '../../models/internal-models.js';
import {DatabaseService, Lang } from '../../services/index.js';
import { InteractionUtils } from '../../utils/index.js';
import { Command, CommandDeferType } from '../index.js';
import {ChartRow} from "../../models/database";

const injuryList = [
    "OK",
    "OK",
    "OK",
    "REM",
    "REM",
    "REM",
    "1 game",
    "1 game",
    "1 game",
    "2 games (or max)",
    "2 games (or max)",
    "3 games (or max)",
    "3 games (or max)",
    "4 games (or max)",
    "5 games (or max)",
    "6 games (or max)",
    "8 games (or max)",
    "12 games (or max)",
    "16 games (or max)",
    "20 games (or max)",
]

// TODO: THIS IS NOT READY - IT NEEDS TO FETCH THE INJURY IMAGE FROM THE DATABASE AND RETURN IT TO THE EMBED
export class InjuryCommand implements Command {
    constructor(
        private databaseService: DatabaseService,
    ) {}

    public names = [Lang.getRef('chatCommands.injury', Language.Default)];
    public deferType = CommandDeferType.PUBLIC;
    public requireClientPerms: PermissionsString[] = [];
    public async execute(intr: ChatInputCommandInteraction, data: EventData): Promise<void> {
        const roll = getRandomInt(1, 20)
        const injuryChart: ChartRow = await this.databaseService.fetchChart("Injury Maximums", intr.guildId)
        let embed: EmbedBuilder = Lang.getEmbed('displayEmbeds.injuryCommand', data.lang, {
            ROLL_RESULT: roll.toString(),
            INJURY: injuryList[roll - 1],
            USER: intr.user.displayName,
            IMAGE_LINK: injuryChart.image_link
        });

        await InteractionUtils.send(intr, embed);
    }
}

const getRandomInt = (min: number, max: number): number => {
    min = Math.ceil(min); // Ensures min is an integer
    max = Math.floor(max); // Ensures max is an integer
    return Math.floor(Math.random() * (max - min + 1)) + min;
}