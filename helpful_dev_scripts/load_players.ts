import fs from 'fs'
import {DatabaseService} from "../src/services";
import { S3Client,  } from '@aws-sdk/client-s3'
import * as stream from "node:stream";
import AWS from "aws-sdk";

const s3Client = new S3Client({ region: 'us-east-1' })

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

/**
 * THIS IS A ONE-OFF SCRIPT!  VALUES HAVE BEEN HARDCODED IN SEVERAL PLACES!  BE CAREFUL AND USE AT YOUR OWN RISK
 * @param filePath
 */
const getRowsFromCSV = async (filePath) => {
    let outputArray = []

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

            const newUrl = await addToS3(player)
            // const databaseService = new DatabaseService()
            // await databaseService.insertPlayer()

        }
    } catch (err) {
        console.error(err)
    }
}

const addToS3 = async (player: PlayerData): Promise<string> => {
    const { writeStream, promise } = uploadStreamToS3({Bucket: 'online-pennant-player-bucket', Key: `${player.season}/${player.playerName}.png`});

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

const uploadStreamToS3 = ({ Bucket, Key }) => {
    const s3 = new AWS.S3();
    const pass = new stream.PassThrough();
    return {
        writeStream: pass,
        promise: s3.upload({ Bucket, Key, Body: pass }).promise(),
    };
}

await getRowsFromCSV('/home/george/Downloads/ops_players.csv')

console.warn("Done!")
process.exit(0)