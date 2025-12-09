import {Knex} from "knex";
import {
  FieldingErrorRow,
} from "../src/models/database";
import {createRequire} from "node:module";
import fs from 'fs'

const require = createRequire(import.meta.url);
let Config = require('../config/config.json');


export class LoadFieldingRanges {
    public async runLoad(): Promise<void> {
        const ranges: FieldingErrorRow[] = await this.loadRanges();
    }

    private async loadRanges(): Promise<FieldingErrorRow[]> {
        const knex: Knex = await this.connect();

        try {
            const data = fs.readFileSync('../fielding_errors.txt', 'utf8');
            const rows = data.split('\n')

            for (let row of rows) {
                const elements = row.split('\t')
                const position = elements[1];
                const eRating = elements[2];
                for (let j = 3; j < 19; j++) {
                    let valueToInsert = null
                    if (elements.length >= j) {
                        valueToInsert = elements[j] === '' ? null : elements[j];
                    }
                    await this.insertFieldingError(knex, j, position, eRating, valueToInsert);
                }
            }
        } catch (err) {
            console.error('Error reading file:', err);
        }

        return []
    }

    private async connect(): Promise<Knex> {
        return require("knex")({
            client: "pg",
            connection: {
                host: Config.database.host,
                port: Config.database.port,
                user: Config.database.username,
                database: Config.database.database,
                password: Config.database.password,
            },
        });
    }

    /**
     * TODO: Return something meaningful and add useful error handling
     * @param commandName
     * @param ownerUsername
     * @param link
     */
    public async insertFieldingError(
        knex: Knex,
        roll: number,
        position: string,
        eRating: string,
        value: string
    ): Promise<void> {
        await knex<FieldingErrorRow>("fielding_error").insert({
            roll: roll,
            position: position,
            e_rating: eRating,
            value: value
        });
    }
}

new LoadFieldingRanges().runLoad();