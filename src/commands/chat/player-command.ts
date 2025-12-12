import {
    ApplicationCommandOptionChoiceData,
    AutocompleteFocusedOption,
    AutocompleteInteraction,
    ChatInputCommandInteraction,
    EmbedBuilder,
    PermissionsString,
} from "discord.js";

import {Language} from '../../models/enum-helpers/index.js';
import {EventData} from '../../models/internal-models.js';
import {Lang} from '../../services/index.js';
import {InteractionUtils} from '../../utils/index.js';
import {Command, CommandDeferType} from '../index.js';
import {DatabaseService} from "../../services/database-service";
import { PlayerRow } from "../../models/database";

export class PlayerCommand implements Command {
    constructor(
        private databaseService: DatabaseService,
    ) {}

    public names = [Lang.getRef('chatCommands.player', Language.Default)];
    public deferType = CommandDeferType.HIDDEN;
    public requireClientPerms: PermissionsString[] = [];
    public async execute(intr: ChatInputCommandInteraction, data: EventData): Promise<void> {
        let args: { name: string } = {
            name: intr.options.getString(
                Lang.getRef('arguments.playerNameOption', Language.Default)
            )
        };

        let embed: EmbedBuilder;

        const result: PlayerRow[] | undefined = await this.databaseService.fetchPlayer(args.name)
        if (result === undefined) {
            embed = Lang.getEmbed('displayEmbeds.playerNameDoesNotExist', data.lang, {
                PLAYER_NAME: args.name
            })

            await InteractionUtils.send(intr, embed);
        } else {
            const positions = result.map((row) => row.position).join(', ')
            // SUCCESS - Simply return the requested command
            embed = Lang.getEmbed('displayEmbeds.playerFetchSuccess', data.lang, {
                PLAYER_NAME: args.name,
                POSITION_NAME: result.length > 1 ? "Positions" : "Position",
                POSITION_VALUE: positions
            })

            await InteractionUtils.send(intr, embed)
        }
    }

    public async autocomplete(intr: AutocompleteInteraction, option: AutocompleteFocusedOption): Promise<ApplicationCommandOptionChoiceData<string | number>[]> {
        const searchString = option.value
        const players: string[] = await this.databaseService.fetchAllPlayersMatchingString(searchString);
        return players.map((player: string) => {
            return {
                name: player,
                name_localizations: {
                    "en-US": player,
                },
                value: player,
            };
        })
    }
}
