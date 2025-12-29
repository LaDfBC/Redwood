import {
  ButtonBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
  PermissionsString,
  ActionRowBuilder,
  ButtonStyle,
  EmbedField,
  Message,
} from "discord.js";

import {Language} from '../../models/enum-helpers/index.js';
import {EventData} from '../../models/internal-models.js';
import {Lang} from '../../services/index.js';
import {InteractionUtils} from '../../utils/index.js';
import {Command, CommandDeferType} from '../index.js';
import {DatabaseService} from "../../services/database-service";
import { CustomCommandWithUsageCountRow } from "../../models/database";

export class CcMineCommand implements Command {
    constructor(
        private databaseService: DatabaseService,
    ) {}

    public names = [Lang.getRef('chatCommands.cc-mine', Language.Default)];
    public deferType = CommandDeferType.PUBLIC;
    public requireClientPerms: PermissionsString[] = [];
    public async execute(intr: ChatInputCommandInteraction, data: EventData): Promise<void> {
        // let args: { searchString: string } = {
        //   searchString: intr.options.getString(
        //     Lang.getRef("arguments.ccMineSearchStringOption", Language.Default),
        //   ),
        // };
        let embed: EmbedBuilder;

        const myCommands: CustomCommandWithUsageCountRow[] = await this.databaseService.fetchAllCommandsForUser(intr.guildId, intr.user.id)

        if (myCommands.length === 0) {
            embed = Lang.getEmbed("displayEmbeds.ccMineNoCommandsResponse", data.lang, {
                USER: intr.user.displayName,
            })
            await InteractionUtils.send(intr, embed)
        } else {
            embed = Lang.getEmbed('displayEmbeds.ccMineSuccessfulResponse', data.lang, {
                USER: intr.user.displayName,
                RANGE_LOW: "1",
                RANGE_HIGH: Math.min(5, myCommands.length).toString(),
                TOTAL_COUNT: myCommands.length.toString(),
            }, buildMyCommandsResponse(myCommands));

            if (myCommands.length <= 5) {
                await InteractionUtils.send(intr, embed);
            } else {
                const messageData: Message = await InteractionUtils.send(intr, {
                  embeds: [embed],
                  components: [
                      new ActionRowBuilder<ButtonBuilder>()
                          .setComponents([
                              new ButtonBuilder({
                                  customId: 'ccMineFirstButton',
                                  style: ButtonStyle.Primary,
                                  emoji: '⏮️',
                                  disabled: true
                              }),
                              new ButtonBuilder({
                                  customId: 'ccMinePreviousButton',
                                  style: ButtonStyle.Primary,
                                  emoji: '◀️',
                                  disabled: true
                              }),
                              new ButtonBuilder({
                                  customId: 'ccMineNextButton',
                                  style: ButtonStyle.Primary,
                                  emoji: '▶️',
                                  disabled: false
                              }),
                              new ButtonBuilder({
                                  customId: 'ccMineLastButton',
                                  style: ButtonStyle.Primary,
                                  emoji: '⏭️',
                                  disabled: false
                              }),

                          ])
                  ],
                });
                await this.databaseService.insertMineCommandMessage(messageData.id, intr.guildId, 1);
            }
        }
    }
}


export const buildMyCommandsResponse = (myCommands: CustomCommandWithUsageCountRow[], page: number = 1): EmbedField[] => {
    let response: EmbedField[] = []
    const lowNum = (page - 1) * 5
    for (let i = (page - 1) * 5; i < Math.min(myCommands.length, 5 + lowNum); i++) {
        let command: CustomCommandWithUsageCountRow = myCommands[i];

        response.push({
          name: command.command_name,
          value: `\`\`\`js\nCreated On: ${command.created.toLocaleDateString()}\nUsages:     ${command.usage_count}\`\`\``,
          inline: false,
        });
    }

    return response
}
