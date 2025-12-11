export interface AbHistoryCombinedRow {
    uuid: string;
    username: string;
    guild_id: string;
    roll_type: string;
    roll_date: Date;
    roll_value: number;
    individual_roll_value: number | undefined;
}
