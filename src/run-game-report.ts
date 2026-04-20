import { Options, Partials } from 'discord.js';
import { createRequire } from 'node:module';

import { CustomClient } from './extensions/index.js';
import { GameReportJob } from './jobs/index.js';
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

    Logger.info('Running GameReportJob...');
    const job = new GameReportJob(client, databaseService, googleSheetsService);
    await job.run();
    Logger.info('GameReportJob complete.');

    await client.destroy();
    process.exit(0);
}

await run().catch(error => {
    Logger.error('run-game-report: unhandled error', error);
    process.exit(1);
});
