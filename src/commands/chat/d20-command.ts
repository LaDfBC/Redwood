import {
  ChatInputCommandInteraction,
  EmbedBuilder,
  Locale,
  PermissionsString,
} from "discord.js";

import { Language } from '../../models/enum-helpers/index.js';
import { EventData } from '../../models/internal-models.js';
import { DatabaseService, Lang } from '../../services/index.js';
import { EmbedUtils, InteractionUtils } from '../../utils/index.js';
import { Command, CommandDeferType } from '../index.js';

export async function executeD20(
    databaseService: DatabaseService,
    userId: string,
    guildId: string,
    displayName: string,
    lang: Locale
): Promise<{embed: EmbedBuilder}> {
     let embed: EmbedBuilder = Lang.getEmbed('displayEmbeds.d20Commands', lang, {
            ROLL_RESULT: getRandomInt(1, 20).toString(),
            USER: displayName,
        });
     await EmbedUtils.applyUserTheme(embed, databaseService, userId, guildId);
     return { embed };
}

export class D20Command implements Command {
    constructor(private databaseService: DatabaseService) {}

    public names = [Lang.getRef('chatCommands.d20', Language.Default)];
    public deferType = CommandDeferType.PUBLIC;
    public requireClientPerms: PermissionsString[] = [];
    public async execute(intr: ChatInputCommandInteraction, data: EventData): Promise<void> {
        const result = await executeD20(this.databaseService, intr.user.id, intr.guildId, intr.user.displayName, data.lang)
        await InteractionUtils.send(intr, result.embed);
    }
}

const getRandomInt = (min: number, max: number): Number => {
    min = Math.ceil(min); // Ensures min is an integer
    max = Math.floor(max); // Ensures max is an integer
    return Math.floor(Math.random() * (max - min + 1)) + min;
}