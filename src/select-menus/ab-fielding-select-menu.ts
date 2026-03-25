import { StringSelectMenuInteraction } from 'discord.js';

import { SelectMenu, SelectMenuDeferType } from './select-menu.js';
import { executeFielding } from '../commands/chat/index.js';
import { EventData } from '../models/internal-models.js';
import { DatabaseService } from '../services/index.js';
import { InteractionUtils } from '../utils/index.js';

export class AbFieldingSelectMenu implements SelectMenu {
    constructor(private databaseService: DatabaseService) {}

    public ids: string[] = ['abFieldingSelectMenu'];
    public deferType: SelectMenuDeferType = SelectMenuDeferType.REPLY;
    public requireGuild = true;

    public async execute(intr: StringSelectMenuInteraction, data: EventData): Promise<void> {
        const position = intr.values[0];
        const result = await executeFielding(
            this.databaseService,
            intr.user.id,
            intr.guildId,
            intr.user.displayName,
            position,
            data.lang
        );
        await InteractionUtils.send(intr, result.embed);
    }
}
