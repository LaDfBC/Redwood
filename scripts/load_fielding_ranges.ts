import {Knex} from "knex";
import { CustomCommandRow, FieldingRangeRow } from "../src/models/database";
import {createRequire} from "node:module";
import fs from 'fs'

const require = createRequire(import.meta.url);
let Config = require('../config/config.json');


export class LoadFieldingRanges {
    public runLoad(): void {
        const ranges: FieldingRangeRow[] = this.loadRanges();
    }

    private async loadRanges(): FieldingRangeRow[] {
        const knex: Knex = await this.connect();

        try {
            const data = fs.readFileSync('../fielding_ranges.txt', 'utf8');
            const splitData = data.replaceAll('\n', '\t').split('\t');
            const rowsOfTwenty = []
            for (let i = 0, l = splitData.length; i < l; i = i + 20) {
                rowsOfTwenty.push(splitData.slice(i, i + 20));
            }

            const positionsInOrder = ['P', 'C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF']
            for (let position of positionsInOrder) {
                const index = positionsInOrder.indexOf(position);
                for (let j = 0; j < 20; j++) {
                    let values = []
                    values.push(rowsOfTwenty[(index * 5) + 0][j]);
                    values.push(rowsOfTwenty[(index * 5) + 1][j]);
                    values.push(rowsOfTwenty[(index * 5) + 2][j]);
                    values.push(rowsOfTwenty[(index * 5) + 3][j]);
                    values.push(rowsOfTwenty[(index * 5) + 4][j]);
                    await this.insertFieldingRange(knex, j, position, values.join(','))
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
    public async insertFieldingRange(
        knex: Knex,
        roll: number,
        position: string,
        values: string,
    ): Promise<void> {
        await knex<FieldingRangeRow>("fielding_range").insert({
          roll: roll + 1,
          position: position,
          values: values,
        });
    }
}

new LoadFieldingRanges().runLoad();