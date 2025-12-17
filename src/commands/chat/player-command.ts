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

    public names = [Lang.getRef('chatCommands.player-fetch', Language.Default)];
    public deferType = CommandDeferType.PUBLIC;
    public requireClientPerms: PermissionsString[] = [];
    public async execute(intr: ChatInputCommandInteraction, data: EventData): Promise<void> {
        let args: { name: string } = {
            name: intr.options.getString(
                Lang.getRef('arguments.playerFetchNameOption', Language.Default)
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
            const positions = result.map((row: PlayerRow) => row.position).join(', ')
            // SUCCESS - Simply return the requested command
            embed = Lang.getEmbed('displayEmbeds.playerFetchSuccess', data.lang, {
                PLAYER_NAME: result[0].player_name,
                POSITION_NAME: result.length > 1 ? "Positions" : "Position",
                POSITION_VALUE: positions,
                IMAGE_LINK: result[0].card_url
            })

            await InteractionUtils.send(intr, embed)
        }
    }

    public async autocomplete(intr: AutocompleteInteraction, option: AutocompleteFocusedOption): Promise<ApplicationCommandOptionChoiceData<string | number>[]> {
        const searchString = option.value
        const players: PlayerRow[] = await this.databaseService.fetchAllPlayersMatchingString(searchString);
        return players.map((player: PlayerRow) => {
            return {
                name: player.player_name,
                name_localizations: {
                    "en-US": player.player_name,
                },
                value: player.player_name,
            };
        })
    }
}
