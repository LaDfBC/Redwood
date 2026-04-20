import { Knex } from 'knex';
import { createRequire } from 'node:module';

import { GameReportRow } from '../src/models/database/index.js';
import { GoogleSheetsService } from '../src/services/index.js';

const require = createRequire(import.meta.url);
const Config = require('../config/config.prod.json');

const GAME_ID_COL = 3;
const SHEET_ID_COL = 2;

async function connect(): Promise<Knex> {
    return require('knex')({
        client: 'pg',
        connection: {
            host: Config.database.host,
            port: Config.database.port,
            user: Config.database.username,
            database: Config.database.database,
            password: Config.database.password,
        },
    });
}

const knex = await connect();
const googleSheetsService = new GoogleSheetsService();

const spreadsheetId: string = Config.jobs.gameReport.spreadsheetId;
const tab: string = Config.jobs.gameReport.tab;
const channelId: string = Config.jobs.gameReport.channelId;

console.log(`Fetching rows from tab "${tab}" in spreadsheet ${spreadsheetId}...`);
const rows = await googleSheetsService.fetchRange(tab, 'A2:X', spreadsheetId);

if (!rows || rows.length === 0) {
    console.log('No rows found. Exiting.');
    process.exit(0);
}

console.log(`Found ${rows.length} rows. Processing...`);

let inserted = 0;
let skipped = 0;

for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const gameId = row[GAME_ID_COL];
    if (!gameId) {
        skipped++;
        continue;
    }

    const existing = await knex<GameReportRow>('game_report_history')
        .where({ game_id: String(gameId) })
        .first();

    if (existing) {
        console.log(`  [SKIP] game_id=${gameId} already in DB`);
        skipped++;
        continue;
    }

    const sheetId = row[SHEET_ID_COL] ? String(row[SHEET_ID_COL]) : spreadsheetId;
    await knex<GameReportRow>('game_report_history').insert({
        game_id: String(gameId),
        sheet_id: sheetId,
        channel_id: channelId,
        posted_at: new Date(),
    });

    console.log(`  [INSERT] game_id=${gameId}`);
    inserted++;
}

console.log(`\nDone. Inserted: ${inserted}, Skipped: ${skipped}`);

await knex.destroy();
process.exit(0);
