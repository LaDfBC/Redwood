import { ChatInputCommandInteraction, EmbedBuilder, PermissionsString, ShardingManager} from 'discord.js';

import { Language } from '../../models/enum-helpers/index.js';
import { EventData } from '../../models/internal-models.js';
import { Lang } from '../../services/index.js';
import { InteractionUtils } from '../../utils/index.js';
import { Command, CommandDeferType } from '../index.js';
import { DatabaseService } from "../../services/database-service";
import fs from "fs";
import AWS from "aws-sdk";
import stream from "node:stream";
import {createRequire} from "node:module";
import {actionName} from "aws-cdk-lib/pipelines/lib/private/identifiers";

const require = createRequire(import.meta.url);
let Config = require("../../../config/config.json");

export class CcCreateCommand implements Command {
  constructor(private databaseService: DatabaseService) {}

  public names = [Lang.getRef("chatCommands.cc-create", Language.Default)];
  public deferType = CommandDeferType.PUBLIC;
  public requireClientPerms: PermissionsString[] = [];
  public async execute(intr: ChatInputCommandInteraction, data: EventData): Promise<void> {
    let args: { name: string, action: string } = {
      name: intr.options.getString(
        Lang.getRef("arguments.ccCreateNameOption", Language.Default),
      ),
      action: intr.options.getString(
        Lang.getRef('arguments.ccCreateActionOption', Language.Default)
      )
    };

    let embed: EmbedBuilder;
    if (await this.databaseService.commandExists(args.name, intr.guildId)) {
      embed = Lang.getEmbed("displayEmbeds.ccCreateCommandNameAlreadyExists", data.lang, {
          //TODO: Get the username of the already-existing command so that we can show a better display message.
          COMMAND_NAME: args.name,
        },
      );
    } else {
      if (args.action.includes("https://media.discordapp.net/attachments/") || args.action.includes("https://cdn.discordapp.com/attachments/")) {
        const s3ImageLink = await this.uploadToS3(args.name, intr.guildId, args.action);

        await this.databaseService.insertCommand(args.name, intr.user.username, intr.guildId, s3ImageLink);
      } else {
        await this.databaseService.insertCommand(args.name, intr.user.username, intr.guildId, args.action);
      }
      embed = Lang.getEmbed('displayEmbeds.ccCreateCommandSuccessful', data.lang, {
        COMMAND_NAME: args.name
      })
    }

    await InteractionUtils.send(intr, embed);
  }

  private async uploadToS3(name: string, guildId: string, imageLink: string): Promise<string> {
    const { writeStream, promise } = this.uploadStreamToS3({
      Bucket: Config.s3.commandBucket,
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
