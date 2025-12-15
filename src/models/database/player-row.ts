import {PlayerType} from "../../enums";

export interface PlayerRow {
    uuid: string;
    player_name: string;
    card_url: string;
    position: string,
    player_type: PlayerType,
    year: number;
    active: boolean;
}
