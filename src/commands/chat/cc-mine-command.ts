import {ChatInputCommandInteraction, EmbedBuilder, PermissionsString} from 'discord.js';

import {Language} from '../../models/enum-helpers/index.js';
import {EventData} from '../../models/internal-models.js';
import {Lang} from '../../services/index.js';
import {InteractionUtils} from '../../utils/index.js';
import {Command, CommandDeferType} from '../index.js';
import {DatabaseService} from "../../services/database-service";
import { CustomCommandRow } from "../../models/database";

export class CcMineCommand implements Command {
    constructor(
        private databaseService: DatabaseService,
    ) {}

    public names = [Lang.getRef('chatCommands.cc-mine', Language.Default)];
    public deferType = CommandDeferType.HIDDEN;
    public requireClientPerms: PermissionsString[] = [];
    public async execute(intr: ChatInputCommandInteraction, data: EventData): Promise<void> {
        let embed: EmbedBuilder;
        const result: CustomCommandRow[] = await this.databaseService.fetchAllCommands()
        const myCommands: CustomCommandRow[] = result.filter(row => row.owner_username === intr.user.username)
        embed = Lang.getEmbed('displayEmbeds.ccMineSuccessfulResponse', data.lang, {
            USER: intr.user.username,

        })

        if (myCommands.length <= 5) {
            await InteractionUtils.send(intr, embed);
        }
    }
}

