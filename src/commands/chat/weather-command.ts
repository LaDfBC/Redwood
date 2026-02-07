import { ChatInputCommandInteraction, EmbedBuilder, PermissionsString } from 'discord.js';

import { Language } from '../../models/enum-helpers/index.js';
import { EventData } from '../../models/internal-models.js';
import { Lang } from '../../services/index.js';
import { InteractionUtils } from '../../utils/index.js';
import { Command, CommandDeferType } from '../index.js';

export class WeatherCommand implements Command {
    public names = [Lang.getRef('chatCommands.weather', Language.Default)];
    public deferType = CommandDeferType.PUBLIC;
    public requireClientPerms: PermissionsString[] = [];
    public async execute(intr: ChatInputCommandInteraction, data: EventData): Promise<void> {
        let embed: EmbedBuilder = Lang.getEmbed('displayEmbeds.weatherCommand', data.lang, {
            ROLL_RESULT: getRandomInt(1, 20).toString(),
            USER: intr.user.displayName,
        });

        await InteractionUtils.send(intr, embed);
    }
}

const getRandomInt = (min: number, max: number): number => {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
};
