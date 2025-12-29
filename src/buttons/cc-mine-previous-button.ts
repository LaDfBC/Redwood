import {DatabaseService, Lang} from "../services/index.js";
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonInteraction,
  ButtonStyle,
  Message,
} from "discord.js";
import {EventData} from "../models/internal-models";
import { Button, ButtonDeferType } from "./index.js";
import {InteractionUtils} from "../utils/index.js";
import {buildMyCommandsResponse} from "../commands/chat/index.js";

export class CcMinePreviousButton implements Button {
  constructor(private databaseService: DatabaseService) {}

  public deferType: ButtonDeferType = ButtonDeferType.UPDATE;
  public ids: string[] = ['ccMinePreviousButton']
  public requireEmbedAuthorTag: boolean = false
  public requireGuild: boolean = true
  public async execute(intr: ButtonInteraction, data: EventData): Promise<void> {
      const paginationData = await this.databaseService.fetchMessagePaginationData(intr.message.id, intr.guildId)
      const mineCommands = await this.databaseService.fetchAllCommandsForUser(intr.guildId, intr.user.id)

      const newPage = paginationData.page - 1

      const embed = Lang.getEmbed('displayEmbeds.ccMineSuccessfulResponse', data.lang, {
                USER: intr.user.displayName,
                RANGE_LOW: (((newPage - 1) * 5) + 1).toString(),
                RANGE_HIGH: (newPage * 5).toString(),
                TOTAL_COUNT: mineCommands.length.toString(),
            }, buildMyCommandsResponse(mineCommands, newPage));

      const message: Message = await InteractionUtils.send(intr, {
          embeds: [embed],
          components: [
              new ActionRowBuilder<ButtonBuilder>()
                  .setComponents([
                      new ButtonBuilder({
                          customId: 'ccMineFirstButton',
                          style: ButtonStyle.Primary,
                          emoji: '⏮️',
                          disabled: newPage === 1
                      }),
                      new ButtonBuilder({
                          customId: 'ccMinePreviousButton',
                          style: ButtonStyle.Primary,
                          emoji: '◀️',
                          disabled: newPage === 1
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
      await this.databaseService.updateMesssagePaginationData(intr.message.id, message.id, intr.guildId, newPage)

  }
}