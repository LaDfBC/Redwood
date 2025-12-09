import { Knex } from "knex";
export declare class LoadFieldingRanges {
    runLoad(): Promise<void>;
    private loadRanges;
    private connect;
    /**
     * TODO: Return something meaningful and add useful error handling
     * @param commandName
     * @param ownerUsername
     * @param link
     */
    insertFieldingError(knex: Knex, roll: number, position: string, eRating: string, value: string): Promise<void>;
}
