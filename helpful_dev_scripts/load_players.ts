import fs from 'fs'
import * as stream from "node:stream";
import AWS from "aws-sdk";
import {Knex} from "knex";
import {
  PlayerPositionRow,
  PlayerRow,
} from "../src/models/database";
import {randomUUID} from "crypto";
import {createRequire} from "node:module";

const require = createRequire(import.meta.url);
let Config = require('../config/config.json');

interface PlayerData {
    season: string;
    playerName: string;
    positions: string[];
    cardUrl: string;
    playerType: PlayerType;
}

enum PlayerType {
    BATTER = "BATTER",
    PITCHER = "PITCHER"
}

export class LoadPlayers {
/**
 * THIS IS A ONE-OFF SCRIPT!  VALUES HAVE BEEN HARDCODED IN SEVERAL PLACES!  BE CAREFUL AND USE AT YOUR OWN RISK
 * @param filePath
 */
    public getRowsFromCSV = async (filePath) => {
        const knex: Knex = await this.connect();
        let count = 0

        try {
            const data = fs.readFileSync(filePath, 'utf8')
            let rows = data.split('\r')
            rows.splice(0, 2)
            for (let i = 0; i < rows.length; i++) {
                let row = rows[i]
                const rowParts = row.split(",")

                let rowIndex = 0
                const season = rowParts[rowIndex++].replaceAll('\n', '')
                const player_name = rowParts[rowIndex++]
                const position1 = rowParts[rowIndex++]
                const position2 = rowParts[rowIndex++]
                const position3 = rowParts[rowIndex++]
                const position4 = rowParts[rowIndex++]
                const position5 = rowParts[rowIndex++]
                const position6 = rowParts[rowIndex++]
                const position7 = rowParts[rowIndex++]
                const position8 = rowParts[rowIndex++]
                const positions = [position1, position2, position3, position4, position5, position6, position7, position8].filter((pos: string) => pos.trim() !== '')
                const pitcherCardUrl = rowParts[rowIndex++]
                const batterCardUrl = rowParts[rowIndex++]

                const player: PlayerData = {
                    season,
                    playerName: player_name,
                    positions,
                    cardUrl: pitcherCardUrl === '' ? batterCardUrl : pitcherCardUrl,
                    playerType: pitcherCardUrl === '' ? PlayerType.BATTER : PlayerType.PITCHER,
                }

                const newUrl = await this.addToS3(player)
                player.cardUrl = newUrl
                await this.insertPlayer(knex, player_name, positions, newUrl, player.playerType, season)
                console.log("COUNT: " + ++count)
            }
        } catch (err) {
            console.error(err)
        }
    }


    private addToS3 = async (player: PlayerData): Promise<string> => {
        const { writeStream, promise } = this.uploadStreamToS3({Bucket: 'online-pennant-player-bucket', Key: `${player.season}/${player.playerName}.png`});

        const image = await fetch(player.cardUrl)
        const bodyStream: ReadableStream = image.body
        const readStream = fs.ReadStream.fromWeb(bodyStream)

        const pipeline = readStream.pipe(writeStream)
        try {
            const result = await promise
            return decodeURIComponent(result.Location).replaceAll(' ', '+')
        } catch (e) {
            console.log('upload failed.', e.message);
            throw(e)
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

    async insertPlayer(knex: Knex, playerName: string, positions: string[], cardUrl: string, playerType: PlayerType, season: string) {
        const playerUuid = randomUUID()
        await knex<PlayerRow>("player").insert({
            uuid: playerUuid,
            player_name: playerName,
            card_url: cardUrl,
            player_type: playerType,
            year: parseInt(season, 10),
            active: true
        });

        await knex<PlayerPositionRow>('player_position')
            .insert(positions.map((position) => {return { uuid: playerUuid, position }}))
    }
}

await new LoadPlayers().getRowsFromCSV('/home/george/Downloads/ops_players.csv')

console.warn("Done!")
process.exit(0)