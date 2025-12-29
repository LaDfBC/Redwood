import {DatabaseService, Lang} from "../services/index.js";
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonInteraction,
  ButtonStyle,
  EmbedBuilder,
  Message,
} from "discord.js";
import {EventData} from "../models/internal-models";
import { Button, ButtonDeferType } from "./index.js";
import {InteractionUtils} from "../utils/index.js";
import {buildMyCommandsResponse} from "../commands/chat/index.js";

export class CcMineNextButton implements Button {
  constructor(private databaseService: DatabaseService) {}

  public deferType: ButtonDeferType = ButtonDeferType.UPDATE;
  public ids: string[] = ['ccMineNextButton']
  public requireEmbedAuthorTag: boolean = false
  public requireGuild: boolean = true
  public async execute(intr: ButtonInteraction, data: EventData): Promise<void> {
      const paginationData = await this.databaseService.fetchMessagePaginationData(intr.message.id, intr.guildId)
      const mineCommands = await this.databaseService.fetchAllCommandsForUser(intr.guildId, intr.user.id)

      const newPage = paginationData.page + 1

      const embed = Lang.getEmbed('displayEmbeds.ccMineSuccessfulResponse', data.lang, {
                USER: intr.user.displayName,
                RANGE_LOW: (((newPage - 1) * 5) + 1).toString(),
                RANGE_HIGH: Math.min((newPage * 5), mineCommands.length).toString(),
                TOTAL_COUNT: mineCommands.length.toString(),
            }, buildMyCommandsResponse(mineCommands, newPage));

      const messageData: Message = await InteractionUtils.send(intr, {
              embeds: [embed],
              components: [
                  new ActionRowBuilder<ButtonBuilder>()
                      .setComponents([
                          new ButtonBuilder({
                              customId: 'ccMineFirstButton',
                              style: ButtonStyle.Primary,
                              emoji: '⏮️',
                              disabled: false
                          }),
                          new ButtonBuilder({
                              customId: 'ccMinePreviousButton',
                              style: ButtonStyle.Primary,
                              emoji: '◀️',
                              disabled: false
                          }),
                          new ButtonBuilder({
                              customId: 'ccMineNextButton',
                              style: ButtonStyle.Primary,
                              emoji: '▶️',
                              disabled: mineCommands.length <= (newPage * 5)
                          }),
                          new ButtonBuilder({
                              customId: 'ccMineLastButton',
                              style: ButtonStyle.Primary,
                              emoji: '⏭️',
                              disabled: mineCommands.length <= (newPage * 5)
                          }),

                      ])
              ],
            });
      await this.databaseService.updateMesssagePaginationData(intr.message.id, messageData.id, intr.guildId, newPage)
  }
}