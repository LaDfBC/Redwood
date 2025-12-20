import { ChatInputCommandInteraction, EmbedBuilder, PermissionsString, ShardingManager} from 'discord.js';

import { Language } from '../../models/enum-helpers/index.js';
import { EventData } from '../../models/internal-models.js';
import { Lang } from '../../services/index.js';
import { InteractionUtils } from '../../utils/index.js';
import { Command, CommandDeferType } from '../index.js';
import { DatabaseService } from "../../services/database-service";
import AWS from "aws-sdk";
import stream from "node:stream";
import {createRequire} from "node:module";
import fs from "fs";

const require = createRequire(import.meta.url);
let Config = require("../../../config/config.json");

export class ChartCreateCommand implements Command {
  constructor(private databaseService: DatabaseService) {}

    public names = [Lang.getRef('chatCommands.chart-create', Language.Default)];
    public deferType = CommandDeferType.PUBLIC;
    public requireClientPerms: PermissionsString[] = [];
    public async execute(intr: ChatInputCommandInteraction, data: EventData): Promise<void> {
        let args: { name: string, title: string, description: string, imageLink: string } = {
            name: intr.options.getString(
                Lang.getRef('arguments.chartCreateNameOption', Language.Default)
            ),
            title: intr.options.getString(
                Lang.getRef('arguments.chartCreateTitleOption', Language.Default)
            ),
            description: intr.options.getString(
                Lang.getRef('arguments.chartCreateDescriptionOption', Language.Default)
            ),
            imageLink: intr.options.getString(
                Lang.getRef('arguments.chartCreateImageLinkOption', Language.Default)
            )
        };

        let embed: EmbedBuilder;
        if (await this.databaseService.chartExists(args.name, intr.guildId)) {
            embed = Lang.getEmbed('displayEmbeds.chartCreateCommandNameAlreadyExists', data.lang, {
                //TODO: Get the username of the already-existing command so that we can show a better display message.
                CHART_NAME: args.name
            });
        } else {
            try {
                const response = await (await fetch(args.imageLink)).blob()
                if (response.type.startsWith('image')) {
                    const s3ImageLink = await this.uploadToS3(args.name, intr.guildId, args.imageLink);

                    await this.databaseService.insertChart(args.name, intr.user.username, intr.guildId, args.description, args.title, s3ImageLink);
                    embed = Lang.getEmbed('displayEmbeds.chartCreateCommandSuccessful', data.lang, {
                        CHART_NAME: args.name
                    })
                } else {
                    embed = Lang.getEmbed('displayEmbeds.chartCreateCommandFailedBadUrl', data.lang, {
                        CHART_NAME: args.name,
                        IMAGE_LINK: args.imageLink,
                        REASON: "URL is valid but does not point to an image"
                    })
                }
            } catch (e) {
                embed = Lang.getEmbed('displayEmbeds.chartCreateCommandFailedBadUrl', data.lang, {
                    CHART_NAME: args.name,
                    IMAGE_LINK: args.imageLink,
                    REASON: "Invalid or Malformed URL"
                })
            }
        }

    await InteractionUtils.send(intr, embed);
  }

  // TODO: Handle links that aren't images gracefully
  private async uploadToS3(name: string, guildId: string, imageLink: string,): Promise<string> {
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
