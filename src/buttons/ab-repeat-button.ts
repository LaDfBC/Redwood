import { ButtonInteraction } from 'discord.js';

import { Button, ButtonDeferType } from './index.js';
import { createRepeatButtonRow, executeAtBat } from '../commands/chat/index.js';
import { EventData } from '../models/internal-models.js';
import { DatabaseService } from '../services/index.js';
import { InteractionUtils } from '../utils/index.js';

export class AbRepeatButton implements Button {
    constructor(private databaseService: DatabaseService) {}

    public deferType: ButtonDeferType = ButtonDeferType.REPLY;
    public ids: string[] = ['abRepeatButton'];
    public requireEmbedAuthorTag = false;
    public requireGuild = true;

    public async execute(intr: ButtonInteraction, data: EventData): Promise<void> {
        const result = await executeAtBat(
            this.databaseService,
            intr.user.id,
            intr.guildId,
            intr.user.displayName,
            data.lang
        );

        await InteractionUtils.send(intr, {
            embeds: [result.embed],
            components: [createRepeatButtonRow()]
        });
    }
}
