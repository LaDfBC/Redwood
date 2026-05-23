import { Knex } from 'knex';
import { createRequire } from 'node:module';

import { GoogleSheetsService } from '../src/services/index.js';

const require = createRequire(import.meta.url);
const Config = require('../config/config.prod.json');

const PLAYER_NAME_COL = 1; // column B
const INJURY_COL = 2;      // column C

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

// "AJ Martinez" <-> "A.J. Martinez"
function getAlternateName(name: string): string | null {
    const withDots = name.match(/^([A-Z])([A-Z])\s(.+)$/);
    if (withDots) return `${withDots[1]}.${withDots[2]}. ${withDots[3]}`;

    const withoutDots = name.match(/^([A-Z])\.([A-Z])\.\s(.+)$/);
    if (withoutDots) return `${withoutDots[1]}${withoutDots[2]} ${withoutDots[3]}`;

    return null;
}

const knex = await connect();
const googleSheetsService = new GoogleSheetsService();

const spreadsheetId: string = '1UOInsNYV6kNK6PHTNGxo3rElVudcAe4IcQ1DhXEnkv0';
const tab: string = 'Redwood Injuries';

console.log(`Fetching rows from tab "${tab}" in spreadsheet ${spreadsheetId}...`);
const rows = await googleSheetsService.fetchRange(tab, 'A2:C', spreadsheetId);

if (!rows || rows.length === 0) {
    console.log('No rows found. Exiting.');
    process.exit(0);
}

console.log(`Found ${rows.length} rows. Processing...`);

let updated = 0;
let skipped = 0;

for (const row of rows) {
    const playerName = row[PLAYER_NAME_COL];
    const injury = row[INJURY_COL];

    if (!playerName || !injury) {
        skipped++;
        continue;
    }

    let count = await knex('player')
        .where({ player_name: String(playerName) })
        .update({ injury: String(injury) });

    const alternate = getAlternateName(String(playerName));
    if (alternate) {
        count = await knex('player')
            .where({ player_name: alternate })
            .update({ injury: String(injury) });
        if (count > 0) {
            console.log(`  [UPDATE] ${playerName} (matched as "${alternate}") -> ${injury}`);
            updated++;
            continue;
        }
    }

    console.log(`  [UPDATE] ${playerName} -> ${injury}`);
    updated++;
}

console.log(`\nDone. Updated: ${updated}, Skipped: ${skipped}`);

await knex.destroy();
process.exit(0);
