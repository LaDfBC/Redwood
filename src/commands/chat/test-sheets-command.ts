import { ChatInputCommandInteraction, EmbedBuilder, PermissionsString } from 'discord.js';

import { Language } from '../../models/enum-helpers/index.js';
import { EventData } from '../../models/internal-models.js';
import { GoogleSheetsService, Lang } from '../../services/index.js';
import { InteractionUtils } from '../../utils/index.js';
import { Command, CommandDeferType } from '../index.js';

export class TestSheetsCommand implements Command {
    public names = [Lang.getRef('chatCommands.test-sheets', Language.Default)];
    public deferType = CommandDeferType.PUBLIC;
    public requireClientPerms: PermissionsString[] = [];

    constructor(private googleSheetsService: GoogleSheetsService) {}

    public async execute(intr: ChatInputCommandInteraction, data: EventData): Promise<void> {
        let cellValue = await this.googleSheetsService.fetchCellValue('Sheet1', 'A1');

        let embed: EmbedBuilder = Lang.getEmbed('displayEmbeds.testSheets', data.lang, {
            CELL_VALUE: cellValue,
        });

        await InteractionUtils.send(intr, embed);
    }
}
