import {
    ApplicationCommandOptionChoiceData,
    AutocompleteFocusedOption,
    AutocompleteInteraction,
    ChatInputCommandInteraction,
    EmbedBuilder,
    PermissionsString,
} from "discord.js";

import {Language} from '../../models/enum-helpers/index.js';
import {EventData} from '../../models/internal-models.js';
import {Lang} from '../../services/index.js';
import {EmbedUtils, InteractionUtils} from '../../utils/index.js';
import {Command, CommandDeferType} from '../index.js';
import {DatabaseService} from "../../services/database-service";
import {ChartRow} from "../../models/database";
import {EditChartFailureReason} from "../../enums/index.js";
import AWS from "aws-sdk";
import stream from "node:stream";
import fs from "fs";
import {createRequire} from "node:module";

const require = createRequire(import.meta.url);
let Config = require("../../../config/config.json");

export class ChartEditCommand implements Command {
    constructor(private databaseService: DatabaseService) {}

    public names = [Lang.getRef('chatCommands.chart-edit', Language.Default)];
    public deferType = CommandDeferType.PUBLIC;
    public requireClientPerms: PermissionsString[] = [];

    public async execute(intr: ChatInputCommandInteraction, data: EventData): Promise<void> {
        let args: { name: string; newName: string | null; newImage: string | null } = {
            name: intr.options.getString(
                Lang.getRef('arguments.chartEditNameOption', Language.Default)
            ),
            newName: intr.options.getString(
                Lang.getRef('arguments.chartEditNewNameOption', Language.Default)
            ),
            newImage: intr.options.getString(
                Lang.getRef('arguments.chartEditNewImageOption', Language.Default)
            ),
        };

        let embed: EmbedBuilder;

        // Must provide at least one optional arg
        if (!args.newName && !args.newImage) {
            embed = Lang.getEmbed('displayEmbeds.chartEditNoOptionsProvided', data.lang);
            await InteractionUtils.send(intr, embed);
            return;
        }

        // Check chart exists
        const chart: ChartRow | undefined = await this.databaseService.fetchChart(args.name, intr.guildId);
        if (!chart) {
            embed = Lang.getEmbed('displayEmbeds.chartEditNameDoesNotExist', data.lang, {
                CHART_NAME: args.name,
            });
            await InteractionUtils.send(intr, embed);
            return;
        }

        // Check ownership
        if (chart.owner_username !== intr.user.id) {
            embed = Lang.getEmbed('displayEmbeds.chartEditUserNotOwner', data.lang, {
                CHART_NAME: args.name,
                USER_NAME: intr.user.username,
            });
            await InteractionUtils.send(intr, embed);
            return;
        }

        // If renaming, check new name doesn't conflict
        if (args.newName && await this.databaseService.chartExists(args.newName, intr.guildId)) {
            embed = Lang.getEmbed('displayEmbeds.chartEditNameAlreadyExists', data.lang, {
                NEW_NAME: args.newName,
            });
            await InteractionUtils.send(intr, embed);
            return;
        }

        // Handle S3 operations
        try {
            const finalName = args.newName ?? args.name;

            if (args.newImage) {
                // Validate the new image URL
                const response = await (await fetch(args.newImage)).blob();
                if (!response.type.startsWith('image')) {
                    embed = Lang.getEmbed('displayEmbeds.chartEditBadUrl', data.lang, {
                        IMAGE_LINK: args.newImage,
                        REASON: "URL is valid but does not point to an image",
                    });
                    await InteractionUtils.send(intr, embed);
                    return;
                }

                // Upload new image at the final key
                const s3ImageLink = await this.uploadToS3(finalName, intr.guildId, args.newImage);

                // If renaming, delete old S3 object
                if (args.newName) {
                    await this.deleteFromS3(intr.guildId, args.name);
                }

                // Update DB with new name and/or new image link
                const updates: { chart_name?: string; image_link?: string } = { image_link: s3ImageLink };
                if (args.newName) updates.chart_name = args.newName;

                const result = await this.databaseService.updateChart(args.name, intr.user.id, intr.guildId, updates);
                if (!result.success) {
                    embed = Lang.getEmbed('displayEmbeds.chartEditUnknownError', data.lang);
                    await InteractionUtils.send(intr, embed);
                    return;
                }
            } else if (args.newName) {
                // Only renaming - copy S3 object to new key, delete old
                await this.copyS3Object(intr.guildId, args.name, args.newName);
                await this.deleteFromS3(intr.guildId, args.name);

                const newS3Link = `https://${Config.s3.chartBucket}.s3.${AWS.config.region || 'us-east-1'}.amazonaws.com/${intr.guildId}/${args.newName}.png`.replaceAll(" ", "+");

                const result = await this.databaseService.updateChart(args.name, intr.user.id, intr.guildId, {
                    chart_name: args.newName,
                    image_link: newS3Link,
                });
                if (!result.success) {
                    embed = Lang.getEmbed('displayEmbeds.chartEditUnknownError', data.lang);
                    await InteractionUtils.send(intr, embed);
                    return;
                }
            }

            embed = Lang.getEmbed('displayEmbeds.chartEditSuccess', data.lang, {
                CHART_NAME: finalName,
            });
            await EmbedUtils.applyUserTheme(embed, this.databaseService, intr.user.id, intr.guildId);
        } catch (e) {
            if (args.newImage) {
                embed = Lang.getEmbed('displayEmbeds.chartEditBadUrl', data.lang, {
                    IMAGE_LINK: args.newImage,
                    REASON: "Invalid or Malformed URL",
                });
            } else {
                embed = Lang.getEmbed('displayEmbeds.chartEditUnknownError', data.lang);
            }
        }

        await InteractionUtils.send(intr, embed);
    }

    public async autocomplete(intr: AutocompleteInteraction, option: AutocompleteFocusedOption): Promise<ApplicationCommandOptionChoiceData<string | number>[]> {
        const searchString = option.value;
        const charts: ChartRow[] = await this.databaseService.fetchAllChartsMatchingString(searchString, intr.guildId);
        return charts.map((chart: ChartRow) => {
            return {
                name: chart.chart_name,
                name_localizations: {
                    "en-US": chart.chart_name,
                },
                value: chart.chart_name,
            };
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
            return result.Location.replaceAll(" ", "+");
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

    private async copyS3Object(guildId: string, oldName: string, newName: string): Promise<void> {
        const s3 = new AWS.S3();
        await s3.copyObject({
            Bucket: Config.s3.chartBucket,
            CopySource: `${Config.s3.chartBucket}/${guildId}/${oldName}.png`,
            Key: `${guildId}/${newName}.png`,
        }).promise();
    }

    private async deleteFromS3(guildId: string, name: string): Promise<void> {
        const s3 = new AWS.S3();
        await s3.deleteObject({
            Bucket: Config.s3.chartBucket,
            Key: `${guildId}/${name}.png`,
        }).promise();
    }
}
