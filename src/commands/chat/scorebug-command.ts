import { ChatInputCommandInteraction, PermissionsString } from 'discord.js';

import { Language } from '../../models/enum-helpers/index.js';
import { EventData } from '../../models/internal-models.js';
import { DatabaseService, GoogleSheetsService, Lang } from '../../services/index.js';
import { EmbedUtils, InteractionUtils } from '../../utils/index.js';
import { Command, CommandDeferType } from '../index.js';

export class ScoreBugCommand implements Command {
    constructor(
        private databaseService: DatabaseService,
        private googleSheetsService: GoogleSheetsService
    ) {}

    public names = [Lang.getRef('chatCommands.scorebug', Language.Default)];
    public deferType = CommandDeferType.PUBLIC;
    public requireClientPerms: PermissionsString[] = [];

    public async execute(intr: ChatInputCommandInteraction, data: EventData): Promise<void> {
        const ctx = await this.databaseService.fetchGameContext(intr.guildId, intr.channelId);
        if (!ctx) {
            const embed = Lang.getEmbed('displayEmbeds.scorebugNoContext', data.lang, {});
            await InteractionUtils.send(intr, embed);
            return;
        }

        const spreadsheetId = extractSpreadsheetId(ctx.sheet_link);
        if (!spreadsheetId) {
            const embed = Lang.getEmbed('displayEmbeds.scorebugInvalidLink', data.lang, {});
            await InteractionUtils.send(intr, embed);
            return;
        }

        await InteractionUtils.send(intr, "Talking to Sheets...A few seconds please!");

        let awayRow: any[];
        let homeRow: any[];
        let gameTitle = '';
        try {
            const [awayData, homeData, titleData] = await Promise.all([
                this.googleSheetsService.fetchRange('Box Score', 'I6:V6', spreadsheetId),
                this.googleSheetsService.fetchRange('Box Score', 'I7:V7', spreadsheetId),
                this.googleSheetsService.fetchRange('Box Score', 'E2', spreadsheetId),
            ]);
            awayRow = awayData?.[0] ?? [];
            homeRow = homeData?.[0] ?? [];
            gameTitle = titleData?.[0]?.[0] ?? '';
        } catch (err) {
            const embed = Lang.getEmbed('displayEmbeds.scorebugSheetReadError', data.lang, {});
            await InteractionUtils.send(intr, embed);
            return;
        }

        if (!awayRow?.length || !homeRow?.length) {
            const embed = Lang.getEmbed('displayEmbeds.scorebugNoData', data.lang, {});
            await InteractionUtils.send(intr, embed);
            return;
        }

        const scorebugText = formatScoreBug(awayRow, homeRow);

        const embed = Lang.getEmbed('displayEmbeds.scorebug', data.lang, {
            GAME_TITLE: gameTitle || 'Current Game',
            SCOREBUG: scorebugText,
        });
        await EmbedUtils.applyUserTheme(embed, this.databaseService, intr.user.id, intr.guildId);
        await InteractionUtils.send(intr, embed);
    }
}

function extractSpreadsheetId(url: string): string | undefined {
    const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    return match?.[1];
}

function formatScoreBug(awayRow: any[], homeRow: any[]): string {
    const pad = (val: any, width: number) => String(val ?? '-').padStart(width);

    const header = `         1  2  3  4  5  6  7  8  9 10+ | R  H  E`;

    const fmtTeam = (row: any[]) => {
        const abbr = pad(row[0] ?? '???', 5);
        const innings = [1, 2, 3, 4, 5, 6, 7, 8, 9].map(i => pad(row[i] ?? '-', 2)).join(' ');
        const extra = pad(row[10] ?? '-', 3);
        const r = pad(row[11] ?? '-', 1);
        const h = pad(row[12] ?? '-', 2);
        const e = pad(row[13] ?? '-', 2);
        return `${abbr}   ${innings} ${extra} | ${r} ${h} ${e}`;
    };

    return `\`\`\`\n${header}\n${fmtTeam(awayRow)}\n${fmtTeam(homeRow)}\n\`\`\``;
}
