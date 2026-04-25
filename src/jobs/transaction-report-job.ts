import { Client, EmbedBuilder, TextChannel } from 'discord.js';
import { createRequire } from 'node:module';

import { Job } from './index.js';
import { DatabaseService, GoogleSheetsService, Logger } from '../services/index.js';

const require = createRequire(import.meta.url);
let Config = require('../../config/config.json');

const COL = {
    TRANS_ID: 0,
    TEAM: 1,
    EFFECTIVE: 2,
    TRANSACTION: 3,
    HEADER: 4,
    SUBHEADER: 5,
    BODY: 6,
    LOGO_URL: 7,
    EMBED_HEX: 8,
};

export class TransactionReportJob extends Job {
    public name = 'Transaction Report';
    public schedule: string = Config.jobs.transactionReport.schedule;
    public log: boolean = Config.jobs.transactionReport.log;
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
        const spreadsheetId: string = Config.jobs.transactionReport.spreadsheetId;
        const tab: string = Config.jobs.transactionReport.tab;
        const channelId: string = Config.jobs.transactionReport.channelId;

        if (!channelId || channelId === 'PLACEHOLDER') {
            Logger.error('TransactionReportJob: channelId is not configured in config.json');
            return;
        }

        let rows: any[][];
        try {
            rows = await this.googleSheetsService.fetchRange(tab, 'A2:I', spreadsheetId);
        } catch (err) {
            Logger.error('TransactionReportJob: failed to fetch sheet rows', err);
            return;
        }

        if (!rows || rows.length === 0) return;

        for (const row of rows) {
            const transId = row[COL.TRANS_ID];
            if (!transId) continue;

            let alreadyPosted: boolean;
            try {
                alreadyPosted = await this.databaseService.isTransactionReportPosted(String(transId));
            } catch (err) {
                Logger.error(`TransactionReportJob: DB check failed for transaction ${transId}`, err);
                continue;
            }
            if (alreadyPosted) continue;

            const embed = buildEmbed(row);

            try {
                const channel = await this.client.channels.fetch(channelId);
                if (!channel || !(channel instanceof TextChannel)) {
                    Logger.error(`TransactionReportJob: channel ${channelId} not found or not a text channel`);
                    return;
                }
                await channel.send({ embeds: [embed] });
            } catch (err) {
                Logger.error(`TransactionReportJob: failed to post transaction ${transId}`, err);
                continue;
            }

            try {
                await this.databaseService.insertTransactionReport(String(transId), channelId);
            } catch (err) {
                Logger.error(`TransactionReportJob: failed to record transaction ${transId} in DB`, err);
            }
        }
    }
}

function buildEmbed(row: any[]): EmbedBuilder {
    const get = (col: number): string => (row[col] != null ? String(row[col]).trim() : '');

    const hexRaw = get(COL.EMBED_HEX).replace('#', '');
    const color = hexRaw ? parseInt(hexRaw, 16) : 0x000000;

    const embed = new EmbedBuilder().setColor(isNaN(color) ? 0x000000 : color);

    const header = get(COL.HEADER);
    if (header) embed.setTitle(header);

    const body = get(COL.BODY).replaceAll('\\n', '\n');
    if (body) embed.setDescription(body);

    const logoUrl = get(COL.LOGO_URL);
    if (logoUrl) embed.setThumbnail(logoUrl);

    return embed;
}
