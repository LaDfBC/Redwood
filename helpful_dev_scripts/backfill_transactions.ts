import { Knex } from 'knex';
import { createRequire } from 'node:module';

import { TransactionReportRow } from '../src/models/database/index.js';
import { GoogleSheetsService } from '../src/services/index.js';

const require = createRequire(import.meta.url);
const Config = require('../config/config.prod.json');

const TRANS_ID_COL = 0;

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

const spreadsheetId: string = Config.jobs.transactionReport.spreadsheetId;
const tab: string = Config.jobs.transactionReport.tab;
const channelId: string = Config.jobs.transactionReport.channelId;

console.log(`Fetching rows from tab "${tab}" in spreadsheet ${spreadsheetId}...`);
const rows = await googleSheetsService.fetchRange(tab, 'A2:I', spreadsheetId);

if (!rows || rows.length === 0) {
    console.log('No rows found. Exiting.');
    process.exit(0);
}

console.log(`Found ${rows.length} rows. Processing...`);

let inserted = 0;
let skipped = 0;

for (const row of rows) {
    const transId = row[TRANS_ID_COL];
    if (!transId) {
        skipped++;
        continue;
    }

    const existing = await knex<TransactionReportRow>('transaction_report_history')
        .where({ trans_id: String(transId) })
        .first();

    if (existing) {
        console.log(`  [SKIP] trans_id=${transId} already in DB`);
        skipped++;
        continue;
    }

    await knex<TransactionReportRow>('transaction_report_history').insert({
        trans_id: String(transId),
        channel_id: channelId,
        posted_at: new Date(),
    });

    console.log(`  [INSERT] trans_id=${transId}`);
    inserted++;
}

console.log(`\nDone. Inserted: ${inserted}, Skipped: ${skipped}`);

await knex.destroy();
process.exit(0);
