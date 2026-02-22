import fs from 'fs'
import path from 'node:path'
import * as stream from "node:stream";
import AWS from "aws-sdk";
import {Knex} from "knex";
import { PlayerPositionRow, PlayerRow } from "../src/models/database";
import {randomUUID} from "crypto";
import {createRequire} from "node:module";
import {PlayerType} from "../src/enums";

const require = createRequire(import.meta.url);
let Config = require('../config/config.prod.json');

const SEASON = "2025";
const S3_BUCKET = "online-pennant-player-bucket";

export class LoadPlayersFromDirectory {
/**
 * THIS IS A ONE-OFF SCRIPT!  VALUES HAVE BEEN HARDCODED IN SEVERAL PLACES!  BE CAREFUL AND USE AT YOUR OWN RISK
 * @param directoryPath - Path to a flat folder of player card images (e.g. "John Smith.png")
 */
    public loadFromDirectory = async (directoryPath: string) => {
        const knex: Knex = await this.connect();
        let count = 0;

        try {
            const files = fs.readdirSync(directoryPath)
                .filter(file => file.toLowerCase().endsWith('.png'));

            for (const file of files) {
                const rawFileName = path.parse(file).name;
                let playerName: string = rawFileName.split(' ').map((namePart => {
                    if (namePart.includes('.')) {
                        return namePart
                    }
                    return namePart.slice(0, 1).toUpperCase() + namePart.slice(1).toLowerCase();
                })).join(' ');
                const filePath = path.join(directoryPath, file);

                if (playerName === 'Anthony Desclafani') {
                    playerName = 'Anthony DeSclafani';
                }
                if (playerName === 'D.L. Hall') {
                    playerName = 'DL Hall';
                }
                const s3Url = await this.addToS3(playerName, filePath);
                await this.updatePlayer(knex, playerName, s3Url);
                await this.removeStartingPlayerPosition(knex, playerName);
                console.log(`COUNT: ${++count} - ${playerName}`);
            }
        } catch (err) {
            console.error(err);
        }
    }

    private addToS3 = async (playerName: string, filePath: string): Promise<string> => {
        const { writeStream, promise } = this.uploadStreamToS3({
            Bucket: S3_BUCKET,
            Key: `${SEASON}/${playerName}.png`
        });

        const readStream = fs.createReadStream(filePath);
        readStream.pipe(writeStream);

        try {
            const result = await promise;
            return decodeURIComponent(result.Location).replaceAll(' ', '+');
        } catch (e) {
            console.log('upload failed.', e.message);
            throw(e);
        }
    }

    private uploadStreamToS3 = ({ Bucket, Key }) => {
        const s3 = new AWS.S3();
        const pass = new stream.PassThrough();
        return {
            writeStream: pass,
            promise: s3.upload({ Bucket, Key, Body: pass }).promise(),
        };
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

    async insertPlayer(knex: Knex, playerName: string, cardUrl: string) {
        const playerUuid = randomUUID();
        await knex<PlayerRow>("player").insert({
            uuid: playerUuid,
            player_name: playerName,
            card_url: cardUrl,
            player_type: PlayerType.BATTER,
            year: parseInt(SEASON, 10),
            active: true
        });
    }


    async updatePlayer(knex: Knex, playerName: string, cardUrl: string) {
        await knex<PlayerRow>('player')
            .where("player_name", playerName)
            .andWhere("year", '2025')
            .update({
                card_url: cardUrl,
            })
    }

    async removeStartingPlayerPosition(knex: Knex, playerName: string) {
        const playerRow: PlayerRow = await knex<PlayerRow>("player")
            .where("player_name", playerName)
            .andWhere("year", '2025')
            .first();

        await knex<PlayerPositionRow>('player_position')
            .where("uuid", playerRow.uuid)
            .andWhere("position", 'SP')
            .del()

    }
}

await new LoadPlayersFromDirectory().loadFromDirectory('/home/george/Downloads/KIGERFIX')

console.warn("Done!")
process.exit(0)