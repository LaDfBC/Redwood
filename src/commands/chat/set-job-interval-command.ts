import { ChatInputCommandInteraction, EmbedBuilder, PermissionsString } from 'discord.js';
import { createRequire } from 'node:module';

import { JobOption } from '../../enums/index.js';
import { Language } from '../../models/enum-helpers/index.js';
import { EventData } from '../../models/internal-models.js';
import { DatabaseService } from '../../services/database-service.js';
import { JobService, Lang } from '../../services/index.js';
import { EmbedUtils, InteractionUtils } from '../../utils/index.js';
import { Command, CommandDeferType } from '../index.js';

const require = createRequire(import.meta.url);
let Config = require('../../../config/config.json');

export class SetJobIntervalCommand implements Command {
    constructor(
        private jobService: JobService,
        private databaseService: DatabaseService
    ) {}

    public names = [Lang.getRef('chatCommands.set-job-interval', Language.Default)];
    public deferType = CommandDeferType.PUBLIC;
    public requireClientPerms: PermissionsString[] = [];

    public async execute(intr: ChatInputCommandInteraction, data: EventData): Promise<void> {
        if (!Config.privilegedUsers.includes(intr.user.id)) {
            await InteractionUtils.send(
                intr,
                Lang.getEmbed('errorEmbeds.setJobIntervalUnauthorized', data.lang)
            );
            return;
        }

        const minutes = intr.options.getInteger(
            Lang.getRef('arguments.setJobIntervalMinutes', Language.Default),
            true
        );
        const job = intr.options.getString(
            Lang.getRef('arguments.setJobIntervalJob', Language.Default),
            true
        );

        const cronSchedule = `0 */${minutes} * * * *`;
        const changes: string[] = [];

        if (job === JobOption.GAME_REPORT || job === JobOption.ALL) {
            const ok = this.jobService.reschedule('Game Report', cronSchedule);
            if (!ok) {
                await InteractionUtils.send(intr,
                    Lang.getEmbed('errorEmbeds.setJobIntervalFailed', data.lang,
                        { JOB_NAME: 'Game Report' }));
                return;
            }
            changes.push(`Game Report → every ${minutes} minute` + (minutes === 1 ? 's' : ''));
        }

        if (job === JobOption.TRANSACTION_REPORT || job === JobOption.ALL) {
            const ok = this.jobService.reschedule('Transaction Report', cronSchedule);
            if (!ok) {
                await InteractionUtils.send(intr,
                    Lang.getEmbed('errorEmbeds.setJobIntervalFailed', data.lang,
                        { JOB_NAME: 'Transaction Report' }));
                return;
            }
            changes.push(`Transaction Report → every ${minutes} minute` + (minutes === 1 ? 's' : ''));
        }

        const embed: EmbedBuilder = Lang.getEmbed('errorEmbeds.setJobIntervalSuccess', data.lang,
            { CHANGES: changes.join('\n') });
        await EmbedUtils.applyUserTheme(embed, this.databaseService, intr.user.id, intr.guildId);
        await InteractionUtils.send(intr, embed);
    }
}
