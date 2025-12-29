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

export class CcMineFirstButton implements Button {
  constructor(private databaseService: DatabaseService) {}

  public deferType: ButtonDeferType = ButtonDeferType.UPDATE;
  public ids: string[] = ['ccMineFirstButton']
  public requireEmbedAuthorTag: boolean = false
  public requireGuild: boolean = true
  public async execute(intr: ButtonInteraction, data: EventData): Promise<void> {
      const mineCommands = await this.databaseService.fetchAllCommandsForUser(intr.guildId, intr.user.id)
      const embed = Lang.getEmbed('displayEmbeds.ccMineSuccessfulResponse', data.lang, {
                USER: intr.user.displayName,
                RANGE_LOW: "1",
                RANGE_HIGH: "5",
                TOTAL_COUNT: mineCommands.length.toString(),
            }, buildMyCommandsResponse(mineCommands, 1));

      const message: Message = await InteractionUtils.send(intr, {
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
      await this.databaseService.updateMesssagePaginationData(intr.message.id, message.id, intr.guildId, 1)
  }
}