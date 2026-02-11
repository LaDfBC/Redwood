import { ButtonInteraction } from 'discord.js';

import { Button, ButtonDeferType } from './index.js';
import { createRollRepeatButtonRow, executeRoll } from '../commands/chat/index.js';
import { EventData } from '../models/internal-models.js';
import { InteractionUtils } from '../utils/index.js';

export class RollRepeatButton implements Button {
    public deferType: ButtonDeferType = ButtonDeferType.REPLY;
    public ids: string[] = ['rollRepeatButton'];
    public requireEmbedAuthorTag = false;
    public requireGuild = false;

    public async execute(intr: ButtonInteraction, data: EventData): Promise<void> {
        const title = intr.message.embeds[0]?.title;
        const match = title?.match(/(\d+)d(\d+)/i);
        if (!match) return;

        const numDice = parseInt(match[1], 10);
        const numSides = parseInt(match[2], 10);

        const { embed } = executeRoll(numDice, numSides, data.lang);

        await InteractionUtils.send(intr, {
            embeds: [embed],
            components: [createRollRepeatButtonRow()],
        });
    }
}
