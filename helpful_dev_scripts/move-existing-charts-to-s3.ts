import AWS from "aws-sdk";
import {Knex} from "knex";
import {createRequire} from "node:module";
import fs from "fs";
import stream from "node:stream";
import { ChartRow } from "../src/models/database";

const require = createRequire(import.meta.url);
let Config = require('../config/config.prod.json');

export class ConvertChartsToS3 {
  public async convertCharts(): Promise<void> {
    const knex: Knex = await this.connect();

    const charts: ChartRow[] = await knex<ChartRow[]>("chart")
      .select("chart_name", "guild_id", "image_link")
      .where("guild_id", "1435058797885263873");

    for(let chart of charts) {
      const s3Link = await this.uploadToS3(chart.chart_name, chart.guild_id, chart.image_link)
      await knex<ChartRow>('chart').update('image_link', s3Link).where('chart_name', chart.chart_name)
    }

    console.warn("Done!")
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

  private async uploadToS3(name: string, guildId: string, imageLink: string): Promise<string> {
    const { writeStream, promise } = this.uploadStreamToS3({
      Bucket: Config.s3.chartBucket,
      Key: `${guildId}/${name}.png`,
    });

    const image = await fetch(imageLink);
    const bodyStream: ReadableStream = image.body;
    const readStream = fs.ReadStream.fromWeb(bodyStream);

    readStream.pipe(writeStream);
    try {
      const result = await promise;
      return decodeURIComponent(result.Location).replaceAll(" ", "+");
    } catch (e) {
      console.log("upload failed.", e.message);
      throw e;
    }
  }

  private uploadStreamToS3 = ({ Bucket, Key }) => {
    const s3 = new AWS.S3();
    const pass = new stream.PassThrough();
    return {
      writeStream: pass,
      promise: s3.upload({ Bucket, Key, Body: pass }).promise(),
    };
  };
}

await new ConvertChartsToS3().convertCharts()