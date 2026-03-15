import { ChatInputCommandInteraction, EmbedBuilder, GuildMember, PermissionsString } from 'discord.js';

import { Language } from '../../models/enum-helpers/index.js';
import { EventData } from '../../models/internal-models.js';
import { DatabaseService, GoogleSheetsService, Lang } from '../../services/index.js';
import { EmbedUtils, InteractionUtils } from '../../utils/index.js';
import { Command, CommandDeferType } from '../index.js';

export class WeatherCommand implements Command {
    constructor(private databaseService: DatabaseService, private googleSheetsService: GoogleSheetsService) {}

    public names = [Lang.getRef('chatCommands.weather', Language.Default)];
    public deferType = CommandDeferType.PUBLIC;
    public requireClientPerms: PermissionsString[] = [];
    public async execute(intr: ChatInputCommandInteraction, data: EventData): Promise<void> {
        let embed: EmbedBuilder = Lang.getEmbed('displayEmbeds.weatherCommand', data.lang, {
            ROLL_RESULT: getRandomInt(1, 20).toString(),
            USER: intr.user.displayName,
        });
        await EmbedUtils.applyUserTheme(embed, this.databaseService, intr.user.id, intr.guildId);

        await InteractionUtils.send(intr, embed);
    }
}

const getRandomInt = (min: number, max: number): number => {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
};

async function findUserTeam(intr: ChatInputCommandInteraction, googleSheetsService: GoogleSheetsService): Promise<string | undefined> {
    const rows = await googleSheetsService.fetchRange('Teams', 'F:G');
    const teamNames = rows
        .slice(1)
        .filter(row => row[0] && row[1])
        .map(row => row[0].trim() + ' ' + row[1].trim());

    const member = intr.member as GuildMember;
    const roleNames = member.roles.cache
        .filter(r => r.name !== '@everyone')
        .map(r => r.name);

    return roleNames.find(role =>
        teamNames.some(team => team.toLowerCase() === role.toLowerCase())
    );
}
