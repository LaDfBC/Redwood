import { ChatInputCommandInteraction, EmbedBuilder, PermissionsString } from 'discord.js';

import { Language } from '../../models/enum-helpers/index.js';
import { EventData } from '../../models/internal-models.js';
import { DatabaseService, Lang } from '../../services/index.js';
import { EmbedUtils, InteractionUtils } from '../../utils/index.js';
import { Command, CommandDeferType } from '../index.js';

const vibeList = [
    "The universe woke up and chose violence against you.",
    "Every plan you make immediately regrets itself.",
    "Luck saw you coming and crossed the street.",
    "Nothing’s on fire, but it’s close.",
    "You’re playing life on hard mode today.",
    "Minor inconveniences have unionized.",
    "It’s not bad luck, it’s aggressively mediocre.",
    "Things work… eventually… with effort… sigh.",
    "Small wins appear, but they make you work for it.",
    "The day is cooperating, but not enthusiastically.",
    "Good timing keeps showing up uninvited.",
    "You keep accidentally doing things right.",
    "Doors open like they were already unlocked.",
    "Bad ideas are weirdly paying off.",
    "The odds are suspiciously in your favor.",
    "Luck is hovering nearby, making eye contact.",
    "You’re on a hot streak and you didn’t earn it.",
    "Reality is bending slightly to accommodate you.",
    "This level of luck feels legally questionable.",
    "The universe is simping for you today."
]

export class VibeCommand implements Command {
    constructor(private databaseService: DatabaseService) {}

    public names = [Lang.getRef('chatCommands.vibe', Language.Default)];
    public deferType = CommandDeferType.PUBLIC;
    public requireClientPerms: PermissionsString[] = [];
    public async execute(intr: ChatInputCommandInteraction, data: EventData): Promise<void> {
        let embed: EmbedBuilder = Lang.getEmbed('displayEmbeds.vibeCommand', data.lang, {
            VIBE: vibeList[getRandomInt(1, 20) - 1],
            USER: intr.user.displayName,
        });
        await EmbedUtils.applyUserTheme(embed, this.databaseService, intr.user.id, intr.guildId);

        await InteractionUtils.send(intr, embed);
    }
}

const getRandomInt = (min: number, max: number): number => {
    min = Math.ceil(min); // Ensures min is an integer
    max = Math.floor(max); // Ensures max is an integer
    return Math.floor(Math.random() * (max - min + 1)) + min;
}