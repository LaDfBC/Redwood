import { ChatInputCommandInteraction, EmbedBuilder, PermissionsString } from 'discord.js';

import { Language } from '../../models/enum-helpers/index.js';
import { EventData } from '../../models/internal-models.js';
import { DatabaseService, Lang } from '../../services/index.js';
import { EmbedUtils, InteractionUtils } from '../../utils/index.js';
import { Command, CommandDeferType } from '../index.js';

const ACHIEVEMENT_NAME = 'Dataminer';
const ACHIEVEMENT_LEVEL = 'silver' as const;

const SNARKY_ALREADY_EARNED = [
    "Oh fuck, it's your nerdy ass again. Trying to get a second Silver Dungeon Master Box?",
    "You already have the Data Miner achievement, and you thought I wouldn't remember the first time?",
    "A more benevolent bot would reward your audacity but, it just makes me angry.",
    "You know what? I'm actually removing your silver Data Miner box as a lesson not to cheat."
];

export class GoddammitDonutCommand implements Command {
    constructor(private databaseService: DatabaseService) {}

    public names = [Lang.getRef('chatCommands.goddammit-donut', Language.Default)];
    public deferType = CommandDeferType.HIDDEN;
    public requireClientPerms: PermissionsString[] = [];

    public async execute(intr: ChatInputCommandInteraction, data: EventData): Promise<void> {
        const existing = await this.databaseService.fetchAchievement(intr.user.id, ACHIEVEMENT_NAME);

        if (existing) {
            await this.databaseService.cancelAchievement(intr.user.id, ACHIEVEMENT_NAME);
            const errorEmbed = new EmbedBuilder()
                .setTitle("New Quest!  Be Modest!")
                .addFields({
                    name: "Go away",
                    value: SNARKY_ALREADY_EARNED.join('\n\n'),
                })
                .setColor(0x964B00)
                .setFooter({ text: "Don't be a greedy dick" });
            await InteractionUtils.send(intr, errorEmbed, true);
            return;
        }

        await this.databaseService.insertAchievement(intr.user.id, ACHIEVEMENT_LEVEL, ACHIEVEMENT_NAME);

        let embed: EmbedBuilder = Lang.getEmbed('displayEmbeds.goddammitDonut', data.lang, {
            USER: intr.user.displayName,
            TEXT: "So you know those freaks who look at code changes in video games to see what is coming in the next release or figure out what the devs have in store in the future?  The ones who don't have a girlfriend excpet in World of Warcraft?  Yeah, they're called Data Miners.\n" +
                "\n" +
                "Are you aware that you just called a secret command I did not tell anyone about, isn't in the help docs, has no impact on gameplay, can't be seen by anyone else, and generally should never be invoked, because why would it be?  Are you also aware you did this to a Discord bot" +
                " that is in like 4 total servers and is used for a game that emulates baseball by rolling d20s?  So you're a self-loathing nerd that won't play D&D and instead have to act like you love sports by making D&D emulate baseball but also arguing about the stats instead of just enjoying the game?\n\n" +
                "Wow. Even I'm impressed by how desperate and sad that is.\n\n" +
                "**Reward:** You clearly need a little bit of joy in your life so I'm giving you a Silver \"Dungeon Master\" box.  Since you're such a sweaty nerd, I'm sure you can also find the command I have that opens it."
        });
        await EmbedUtils.applyUserTheme(embed, this.databaseService, intr.user.id, intr.guildId);
        await InteractionUtils.send(intr, embed);
    }
}
