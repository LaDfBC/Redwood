import { Options, Partials } from 'discord.js';
import { createRequire } from 'node:module';

import { CustomClient } from './extensions/index.js';
import { TransactionReportJob } from './jobs/index.js';
import { DatabaseService, GoogleSheetsService, Logger } from './services/index.js';

const require = createRequire(import.meta.url);
const Config = require('../config/config.json');

async function run(): Promise<void> {
    const databaseService = new DatabaseService();
    const googleSheetsService = new GoogleSheetsService();

    const client = new CustomClient({
        intents: Config.client.intents,
        partials: (Config.client.partials as string[]).map(partial => Partials[partial]),
        makeCache: Options.cacheWithLimits({
            ...Options.DefaultMakeCacheSettings,
            ...Config.client.caches,
        }),
        enforceNonce: true,
    });

    await client.login(Config.client.token);
    await new Promise<void>(resolve => client.once('ready', () => resolve()));

    Logger.info('Running TransactionReportJob...');
    const job = new TransactionReportJob(client, databaseService, googleSheetsService);
    await job.run();
    Logger.info('TransactionReportJob complete.');

    await client.destroy();
    process.exit(0);
}

await run().catch(error => {
    Logger.error('run-transaction-report: unhandled error', error);
    process.exit(1);
});
