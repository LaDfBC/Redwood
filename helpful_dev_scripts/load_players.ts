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
import {MessagePaginationRow} from "../src/models/database/message-pagination-row";

const require = createRequire(import.meta.url);
let Config = require('../config/config.prod.json');

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
            for (let i = 1377; i < rows.length; i++) {
                let row = rows[i]
                const rowParts = row.split(",")

                let rowIndex = 0
                const season = rowParts[rowIndex++].replaceAll('\n', '')
                let player_name = rowParts[rowIndex++]
                if (player_name.includes('MJ ')) {
                    player_name = player_name.replaceAll('MJ ', 'M.J. ')
                }
                if (player_name.includes('PJ ')) {
                    player_name = player_name.replaceAll('PJ ', 'P.J. ')
                }
                if (player_name.includes('RJ ')) {
                    player_name = player_name.replaceAll('RJ ', 'R.J. ')
                }
                if (player_name.includes('TJ ')) {
                    player_name = player_name.replaceAll('TJ ', 'T.J. ')
                }
                const position1 = rowParts[rowIndex++].replaceAll('\n', '')
                const position2 = rowParts[rowIndex++].replaceAll('\n', '')
                const position3 = rowParts[rowIndex++].replaceAll('\n', '')
                const position4 = rowParts[rowIndex++].replaceAll('\n', '')
                const position5 = rowParts[rowIndex++].replaceAll('\n', '')
                const position6 = rowParts[rowIndex++].replaceAll('\n', '')
                const position7 = rowParts[rowIndex++].replaceAll('\n', '')
                const positions = [position1, position2, position3, position4, position5, position6, position7].filter(pos => pos.trim() !== '')
                const batterCardUrl = rowParts[rowIndex++]

                const player: PlayerData = {
                    season,
                    playerName: player_name,
                    positions,
                    cardUrl: batterCardUrl,
                    playerType: positions.includes('SP') || positions.includes('RP') ? PlayerType.PITCHER : PlayerType.BATTER,
                }

                // const newUrl = await this.addToS3(player)
                // player.cardUrl = newUrl
                await this.updatePlayer(knex, player_name, positions, '', player.playerType, season)
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

    async updatePlayer(knex: Knex, playerName: string, positions: string[], cardUrl: string, playerType: PlayerType, season: string) {
        const playerUuid: string = await knex.select("uuid").from('player').where("player_name", playerName).andWhere("year", "2025").first();
        if (!playerUuid) {
            throw "COULD NOT FIND PLAYER: " + playerName;
        }

         await knex<PlayerPositionRow>('player_position')
            .insert(positions.map((position) => {return { uuid: playerUuid['uuid'], position }}))

         await knex<PlayerRow>('player')
                .where("player_name", playerName)
                .andWhere("year", '2025')
                .update({
                    "player_type": playerType,
                })
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


    }
}

await new LoadPlayers().getRowsFromCSV('/home/george/Downloads/player_positions_2025.csv')

console.warn("Done!")
process.exit(0)