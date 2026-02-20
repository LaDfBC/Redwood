import { ChatInputCommandInteraction, EmbedBuilder, Locale, PermissionsString } from 'discord.js';

import { Language } from '../../models/enum-helpers/index.js';
import { EventData } from '../../models/internal-models.js';
import { DatabaseService, Lang } from '../../services/index.js';
import { EmbedUtils, InteractionUtils } from '../../utils/index.js';
import { Command, CommandDeferType } from '../index.js';
import { getRandomInt } from './ab-command.js';

// Reusable jump execution logic
export async function executeJump(
    databaseService: DatabaseService,
    userId: string,
    guildId: string,
    displayName: string,
    lang: Locale
): Promise<{ embed: EmbedBuilder }> {
    const chaosRoll: number = getRandomInt(1, 20);
    let embed: EmbedBuilder;

    if (chaosRoll === 1) {
        embed = Lang.getEmbed('displayEmbeds.jumpPickoffCommand', lang, {
            ROLL_RESULT: getRandomInt(1, 20).toString(),
            USER: displayName,
            CHAOS_ROLL: chaosRoll.toString(),
        });
    } else if (chaosRoll === 2) {
        embed = Lang.getEmbed('displayEmbeds.jumpBalkCommand', lang, {
            ROLL_RESULT: getRandomInt(1, 20).toString(),
            USER: displayName,
            CHAOS_ROLL: chaosRoll.toString(),
        });
    } else {
        const rollOne: number = getRandomInt(1, 6);
        const rollTwo: number = getRandomInt(1, 6);
        embed = Lang.getEmbed('displayEmbeds.jumpStandardCommand', lang, {
            ROLL_RESULT: (rollOne + rollTwo).toString(),
            ROLL_ONE: rollOne.toString(),
            ROLL_TWO: rollTwo.toString(),
            USER: displayName,
            CHAOS_ROLL: chaosRoll.toString(),
        });
        await EmbedUtils.applyUserTheme(embed, databaseService, userId, guildId);
    }

    return { embed };
}

export class JumpCommand implements Command {
    constructor(private databaseService: DatabaseService) {}

    public names = [Lang.getRef('chatCommands.jump', Language.Default)];
    public deferType = CommandDeferType.PUBLIC;
    public requireClientPerms: PermissionsString[] = [];
    public async execute(intr: ChatInputCommandInteraction, data: EventData): Promise<void> {
        const result = await executeJump(
            this.databaseService,
            intr.user.id,
            intr.guildId,
            intr.user.displayName,
            data.lang
        );

        await InteractionUtils.send(intr, result.embed);
    }
}