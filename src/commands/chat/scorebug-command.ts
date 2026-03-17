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

        let awayAbbrVal: any, homeAbbrVal: any, awayRunsVal: any, homeRunsVal: any;
        let halfVal: any, inningVal: any, outsVal: any;
        let pitcherVal: any, batterVal: any, basesVal: any;
        let awayRecordVal: any, homeRecordVal: any;

        try {
            const [
                awayAbbrData, homeAbbrData, awayRunsData, homeRunsData,
                halfData, inningData, outsData, pitcherData, batterData, basesData,
                awayRecordData, homeRecordData,
            ] = await Promise.all([
                this.googleSheetsService.fetchRange('Redwood', 'B2', spreadsheetId),
                this.googleSheetsService.fetchRange('Redwood', 'B3', spreadsheetId),
                this.googleSheetsService.fetchRange('Redwood', 'D2', spreadsheetId),
                this.googleSheetsService.fetchRange('Redwood', 'D3', spreadsheetId),
                this.googleSheetsService.fetchRange('Redwood', 'B5', spreadsheetId),
                this.googleSheetsService.fetchRange('Redwood', 'C5', spreadsheetId),
                this.googleSheetsService.fetchRange('Redwood', 'B6', spreadsheetId),
                this.googleSheetsService.fetchRange('Redwood', 'B8', spreadsheetId),
                this.googleSheetsService.fetchRange('Redwood', 'B9', spreadsheetId),
                this.googleSheetsService.fetchRange('Redwood', 'B11', spreadsheetId),
                this.googleSheetsService.fetchRange('Redwood', 'C2', spreadsheetId),
                this.googleSheetsService.fetchRange('Redwood', 'C3', spreadsheetId),
            ]);
            awayAbbrVal  = awayAbbrData?.[0]?.[0];
            homeAbbrVal  = homeAbbrData?.[0]?.[0];
            awayRunsVal  = awayRunsData?.[0]?.[0];
            homeRunsVal  = homeRunsData?.[0]?.[0];
            halfVal      = halfData?.[0]?.[0];
            inningVal    = inningData?.[0]?.[0];
            outsVal      = outsData?.[0]?.[0];
            pitcherVal   = pitcherData?.[0]?.[0];
            batterVal    = batterData?.[0]?.[0];
            basesVal     = basesData?.[0]?.[0];
            awayRecordVal = awayRecordData?.[0]?.[0];
            homeRecordVal = homeRecordData?.[0]?.[0];
        } catch (err) {
            const embed = Lang.getEmbed('displayEmbeds.scorebugSheetReadError', data.lang, {});
            await InteractionUtils.send(intr, embed);
            return;
        }

        if (!awayAbbrVal || !homeAbbrVal) {
            const embed = Lang.getEmbed('displayEmbeds.scorebugNoData', data.lang, {});
            await InteractionUtils.send(intr, embed);
            return;
        }

        const [base3, base2, base1] = parseBaserunners(basesVal);
        const state: GameState = {
            awayAbbr:  String(awayAbbrVal),
            homeAbbr:  String(homeAbbrVal),
            awayRuns:  String(awayRunsVal ?? '0'),
            homeRuns:  String(homeRunsVal ?? '0'),
            inning:    String(inningVal ?? '1'),
            isTop:     isTopHalf(halfVal),
            outs:      String(outsVal ?? '0'),
            base1,
            base2,
            base3,
            batter:    batterVal  ? String(batterVal)  : '',
            pitcher:   pitcherVal ? String(pitcherVal) : '',
        };

        let scorebugText = formatScoreBug(state);
        if (state.batter)  scorebugText += `\nBAT: ${state.batter}`;
        if (state.pitcher) scorebugText += `\nPIT: ${state.pitcher}`;

        const awayEmoji = await resolveEmoji(intr.guild, state.awayAbbr);
        const homeEmoji = await resolveEmoji(intr.guild, state.homeAbbr);

        const awayRecord = awayRecordVal ? ` (${String(awayRecordVal)})` : '';
        const homeRecord = homeRecordVal ? ` (${String(homeRecordVal)})` : '';

        const embed = Lang.getEmbed('displayEmbeds.scorebug', data.lang, {
            GAME_TITLE: `${awayEmoji} ${state.awayAbbr}${awayRecord} @ ${state.homeAbbr}${homeRecord} ${homeEmoji}`.trim(),
            SCOREBUG: scorebugText,
        });
        await EmbedUtils.applyUserTheme(embed, this.databaseService, intr.user.id, intr.guildId);
        await InteractionUtils.send(intr, embed);
    }
}

interface GameState {
    awayAbbr: string;
    homeAbbr: string;
    awayRuns: string;
    homeRuns: string;
    inning: string;
    isTop: boolean;
    outs: string;
    base1: boolean;
    base2: boolean;
    base3: boolean;
    batter: string;
    pitcher: string;
}

function extractSpreadsheetId(url: string): string | undefined {
    const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    return match?.[1];
}

// B11 is a 3-char string: index 0=3rd, 1=2nd, 2=1st
function parseBaserunners(val: any): [boolean, boolean, boolean] {
    const s = String(val ?? '000').trim();
    return [s[0] === '1', s[1] === '1', s[2] === '1'];
}

function isTopHalf(val: any): boolean {
    const s = String(val ?? '').trim().toLowerCase();
    return s === 'top' || s === '1' || s === 'true';
}

async function resolveEmoji(guild: ChatInputCommandInteraction['guild'], abbr: string): Promise<string> {
    const emoji = guild?.emojis.cache.find(e => e.name === abbr);
    return emoji ? `<:${emoji.name}:${emoji.id}>` : '';
}

function formatScoreBug(state: GameState): string {
    const awayAbbr = state.awayAbbr.padEnd(4);
    const homeAbbr = state.homeAbbr.padEnd(4);
    const b1 = state.base1 ? '●' : '○';
    const b2 = state.base2 ? '●' : '○';
    const b3 = state.base3 ? '●' : '○';
    const half = state.isTop ? '▲' : '▼';

    const line1 = `${awayAbbr} ${state.awayRuns}     ${b2}       ${half} ${state.inning}`;
    const line2 = `${homeAbbr} ${state.homeRuns}   ${b3}   ${b1}   ${state.outs} Out`;

    return `\`\`\`\n${line1}\n${line2}\n\`\`\``;
}
