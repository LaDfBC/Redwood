import { ChatInputCommandInteraction, EmbedBuilder, PermissionsString } from 'discord.js';

import { Language } from '../../models/enum-helpers/index.js';
import { EventData } from '../../models/internal-models.js';
import { Lang } from '../../services/index.js';
import { InteractionUtils } from '../../utils/index.js';
import { Command, CommandDeferType } from '../index.js';

export class ButtStuffCommand implements Command {
    public names = [Lang.getRef('chatCommands.butt-stuff', Language.Default)];
    public deferType = CommandDeferType.HIDDEN;
    public requireClientPerms: PermissionsString[] = [];
    public async execute(intr: ChatInputCommandInteraction, data: EventData): Promise<void> {
        const gifLink = await this.fetchRandomGif()
        await InteractionUtils.send(intr, gifLink);
    }

    private async fetchRandomGif(): Promise<string> {
        const response = await fetch("https://g.tenor.com/v1/search?q=butt&key=LIVDSRZULELA&limit=8")
        const data = await response.json();
        return data['results'][getRandomInt(0, 7)].url
    }
}

const getRandomInt = (min: number, max: number): Number => {
    min = Math.ceil(min); // Ensures min is an integer
    max = Math.floor(max); // Ensures max is an integer
    return Math.floor(Math.random() * (max - min + 1)) + min;
}