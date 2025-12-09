import { createRequire } from "node:module";
import fs from 'fs';
const require = createRequire(import.meta.url);
let Config = require('../config/config.json');
export class LoadFieldingRanges {
    async runLoad() {
        const ranges = await this.loadRanges();
    }
    async loadRanges() {
        const knex = await this.connect();
        try {
            const data = fs.readFileSync('../fielding_errors.txt', 'utf8');
            const rows = data.split('\n');
            for (let row of rows) {
                const elements = row.split('\t');
                const position = elements[1];
                const eRating = elements[2];
                for (let j = 3; j < 19; j++) {
                    let valueToInsert = null;
                    if (elements.length >= j) {
                        valueToInsert = elements[j] === '' ? null : elements[j];
                    }
                    await this.insertFieldingError(knex, j, position, eRating, valueToInsert);
                }
            }
        }
        catch (err) {
            console.error('Error reading file:', err);
        }
        return [];
    }
    async connect() {
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
    async insertFieldingError(knex, roll, position, eRating, value) {
        await knex("fielding_error").insert({
            roll: roll,
            position: position,
            e_rating: eRating,
            value: value
        });
    }
}
new LoadFieldingRanges().runLoad();
//# sourceMappingURL=load_fielding_errors.js.map