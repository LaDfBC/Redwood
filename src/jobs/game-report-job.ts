import { Client, EmbedBuilder, TextChannel } from 'discord.js';
import { createRequire } from 'node:module';
import QuickChart from 'quickchart-js';

import { Job } from './index.js';
import { DatabaseService, GoogleSheetsService, Logger } from '../services/index.js';

const require = createRequire(import.meta.url);
let Config = require('../../config/config.json');

const COL = {
    POSTED: 0,
    TIMESTAMP: 1,
    SHEET_ID: 2,
    GAME_ID: 3,
    A_TM: 4,
    AW_R: 5,
    AW_H: 6,
    AW_E: 7,
    HM_TM: 8,
    HM_R: 9,
    HM_H: 10,
    HM_E: 11,
    WP: 12,
    LP: 13,
    HLD: 14,
    SV: 15,
    BSV: 16,
    HIGHLIGHTS: 17,
    HEADER: 18,
    SUBHEADER: 19,
    LINE_SCORE: 20,
    WIN: 21,
    LOGO_URL: 22,
    WINNER_HEX: 23,
    LOSER_HEX: 24,
};

export class GameReportJob extends Job {
    public name = 'Game Report';
    public schedule: string = Config.jobs.gameReport.schedule;
    public log: boolean = Config.jobs.gameReport.log;
    public runOnce = false;
    public initialDelaySecs = 0;

    constructor(
        private client: Client,
        private databaseService: DatabaseService,
        private googleSheetsService: GoogleSheetsService
    ) {
        super();
    }

    public async run(): Promise<void> {
        const spreadsheetId: string = Config.jobs.gameReport.spreadsheetId;
        const tab: string = Config.jobs.gameReport.tab;
        const channelId: string = Config.jobs.gameReport.channelId;
        const gameLogTab: string = Config.jobs.gameReport.gameLogTab;

        if (!channelId || channelId === 'PLACEHOLDER_CHANNEL_ID') {
            Logger.error('GameReportJob: channelId is not configured in config.json');
            return;
        }

        let rows: any[][];
        try {
            rows = await this.googleSheetsService.fetchRange(tab, 'A2:Y', spreadsheetId);
        } catch (err) {
            Logger.error('GameReportJob: failed to fetch sheet rows', err);
            return;
        }

        if (!rows || rows.length === 0) return;

        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            const gameId = row[COL.GAME_ID];
            const sheetId = row[COL.SHEET_ID] ? String(row[COL.SHEET_ID]) : spreadsheetId;

            if (!gameId) continue;

            let alreadyPosted: boolean;
            try {
                alreadyPosted = await this.databaseService.isGameReportPosted(String(gameId));
            } catch (err) {
                Logger.error(`GameReportJob: DB check failed for game ${gameId}`, err);
                continue;
            }
            if (alreadyPosted) continue;

            const embed: EmbedBuilder = await buildEmbed(row, spreadsheetId, gameLogTab, this.googleSheetsService);

            try {
                const channel = await this.client.channels.fetch(channelId);
                if (!channel || !(channel instanceof TextChannel)) {
                    Logger.error(`GameReportJob: channel ${channelId} not found or not a text channel`);
                    return;
                }
                await channel.send({ embeds: [embed] });
            } catch (err) {
                Logger.error(`GameReportJob: failed to post game ${gameId}`, err);
                continue;
            }

            try {
                await this.databaseService.insertGameReport(String(gameId), sheetId, channelId);
            } catch (err) {
                Logger.error(`GameReportJob: failed to record game ${gameId} in DB`, err);
            }

            // Row 2 is index 0, so sheet row = i + 2
            // try {
            //     await this.googleSheetsService.writeCell(tab, `A${i + 2}`, 'TRUE', spreadsheetId);
            // } catch (err) {
            //     Logger.error(`GameReportJob: failed to mark Posted for game ${gameId}`, err);
            // }
        }
    }
}

function buildBoxScore(lineScore: string): string {
    let scoreParts = ("Team   " + lineScore).split('\\n');
    return "```ansi\n" + scoreParts.join('\n') + "```"
}

async function buildEmbed(row: any[], spreadsheetId: string, gameLogTab: string, googleSheetsService: GoogleSheetsService): Promise<EmbedBuilder> {
    const get = (col: number): string => (row[col] != null ? String(row[col]).trim() : '');

    const awayRuns = parseInt(get(COL.AW_R), 10)
    const homeRuns = parseInt(get(COL.HM_R), 10)
    const isAwayTeamTheWinner = awayRuns > homeRuns

    const hexRaw = get(COL.WINNER_HEX).replace('#', '');
    const loserHex = get(COL.LOSER_HEX).replace('#', '');
    const color = hexRaw ? parseInt(hexRaw, 16) : 0x000000;

    const embed = new EmbedBuilder().setColor(isNaN(color) ? 0x000000 : color);

    const header = get(COL.HEADER);
    if (header) embed.setTitle(header);

    const subheader = get(COL.SUBHEADER);
    if (subheader) embed.setDescription(subheader);

    const logoUrl = get(COL.LOGO_URL);
    if (logoUrl) embed.setThumbnail(logoUrl);

    const lineScore = get(COL.LINE_SCORE);
    const boxScore = buildBoxScore(lineScore);
    if (boxScore) {
        embed.addFields({ name: 'Line Score', value: boxScore, inline: false });
    }


    let pitchingValue = ''
    const wp = get(COL.WP);
    const lp = get(COL.LP);
    if (wp) pitchingValue += `WP: ${wp}`
    if (lp) pitchingValue += `\nLP: ${lp}`


    const hld = get(COL.HLD);
    const sv = get(COL.SV);
    const bsv = get(COL.BSV);
    if (hld) pitchingValue += `\nHLD: ${hld}`
    if (sv)  pitchingValue += `\nSV: ${sv}`
    if (bsv) pitchingValue += `\nBSV: ${bsv}`
    const sheetId = get(COL.SHEET_ID) || spreadsheetId;
    const scorecardUrl = `https://docs.google.com/spreadsheets/d/${sheetId}`;
    embed.addFields({ name: 'Pitching Decisions', value: pitchingValue, inline: true });
    embed.addFields({ name: 'Scorecard', value: `[View Full Scorecard](${scorecardUrl})`, inline: true });

    const highlights = get(COL.HIGHLIGHTS);
    if (highlights) {
        embed.addFields({ name: 'Highlights', value: highlights, inline: false });
    }

    let chartUrl: string
    try {
        const logRows = await googleSheetsService.fetchRange(gameLogTab, 'F1:F', sheetId);
        if (logRows && logRows.length > 0) {
            const values = logRows
                .map(r => parseFloat(r[0]))
                .filter(v => !isNaN(v));

            if (values.length > 0) {
                const chart = new QuickChart();
                chart.setConfig({
                    type: 'bar',
                    data: {
                        labels: values.map((_, i) => String(i + 1)),
                        datasets: [{
                            data: values,
                            backgroundColor: values.map(v => v >= 0
                                ? (isAwayTeamTheWinner ? `#${hexRaw}` : `#${loserHex}`)
                                : (isAwayTeamTheWinner ? `#${loserHex}` : `#${hexRaw}`)
                            ),
                        }],
                    },
                    options: {
                        legend: { display: false },
                        scales: {
                            yAxes: [{ ticks: { min: -1, max: 1 } }],
                            xAxes: [{ ticks: { display: false } }],
                        },
                        title: { display: true, text: 'Win Probability' },
                    },
                });
                chartUrl = await chart.getShortUrl();
            }
        }
    } catch (err) {
        Logger.error('GameReportJob: failed to generate win probability chart', err);
    }
    if (chartUrl) embed.setImage(chartUrl);


    return embed;
}
