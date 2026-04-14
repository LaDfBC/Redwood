import { ButtonInteraction } from 'discord.js';

import { Button, ButtonDeferType } from './index.js';
import { EventData } from '../models/internal-models.js';
import { InteractionUtils } from '../utils/index.js';
import {executeD20} from "../commands/chat/d20-command.js";
import {DatabaseService} from "../services";

export class AbD20Button implements Button {
    constructor(private databaseService: DatabaseService) {}

    public deferType: ButtonDeferType = ButtonDeferType.REPLY;
    public ids: string[] = ['abD20Button'];
    public requireEmbedAuthorTag = false;
    public requireGuild = true;

    public async execute(intr: ButtonInteraction, data: EventData): Promise<void> {
        const result = await executeD20(
            this.databaseService,
            intr.user.id,
            intr.guildId,
            intr.user.displayName,
            data.lang
        );

        await InteractionUtils.send(intr, {
            embeds: [result.embed]
        });
    }
}
