import { APIApplicationCommandBasicOption, ApplicationCommandOptionType } from 'discord.js';

import { DevCommandName, HelpOption, InfoOption } from '../enums/index.js';
import { Language } from '../models/enum-helpers/index.js';
import {DatabaseService, Lang } from '../services/index.js';
import {CustomCommandRow} from "../models/database/index.js";

export class Args {
    public static readonly DEV_COMMAND: APIApplicationCommandBasicOption = {
        name: Lang.getRef('arguments.command', Language.Default),
        name_localizations: Lang.getRefLocalizationMap('arguments.command'),
        description: Lang.getRef('argDescs.devCommand', Language.Default),
        description_localizations: Lang.getRefLocalizationMap('argDescs.devCommand'),
        type: ApplicationCommandOptionType.String,
        choices: [
            {
                name: Lang.getRef('devCommandNames.info', Language.Default),
                name_localizations: Lang.getRefLocalizationMap('devCommandNames.info'),
                value: DevCommandName.INFO,
            },
        ],
    };
    public static readonly HELP_OPTION: APIApplicationCommandBasicOption = {
        name: Lang.getRef('arguments.option', Language.Default),
        name_localizations: Lang.getRefLocalizationMap('arguments.option'),
        description: Lang.getRef('argDescs.helpOption', Language.Default),
        description_localizations: Lang.getRefLocalizationMap('argDescs.helpOption'),
        type: ApplicationCommandOptionType.String,
        choices: [
            {
                name: Lang.getRef('helpOptionDescs.contactSupport', Language.Default),
                name_localizations: Lang.getRefLocalizationMap('helpOptionDescs.contactSupport'),
                value: HelpOption.CONTACT_SUPPORT,
            },
            {
                name: Lang.getRef('helpOptionDescs.commands', Language.Default),
                name_localizations: Lang.getRefLocalizationMap('helpOptionDescs.commands'),
                value: HelpOption.COMMANDS,
            },
        ],
    };
    public static readonly INFO_OPTION: APIApplicationCommandBasicOption = {
        name: Lang.getRef('arguments.option', Language.Default),
        name_localizations: Lang.getRefLocalizationMap('arguments.option'),
        description: Lang.getRef('argDescs.helpOption', Language.Default),
        description_localizations: Lang.getRefLocalizationMap('argDescs.helpOption'),
        type: ApplicationCommandOptionType.String,
        choices: [
            {
                name: Lang.getRef('infoOptions.about', Language.Default),
                name_localizations: Lang.getRefLocalizationMap('infoOptions.about'),
                value: InfoOption.ABOUT,
            },
            {
                name: Lang.getRef('infoOptions.translate', Language.Default),
                name_localizations: Lang.getRefLocalizationMap('infoOptions.translate'),
                value: InfoOption.TRANSLATE,
            },
        ],
    };
    public static readonly CC_CREATE_NAME_OPTION: APIApplicationCommandBasicOption = {
        name: Lang.getRef('arguments.cc-create-name-option', Language.Default),
        name_localizations: Lang.getRefLocalizationMap('arguments.cc-create-name-option'),
        description: Lang.getRef('argDescs.cc-create-name-option', Language.Default),
        description_localizations: Lang.getRefLocalizationMap('argDescs.cc-create-name-option'),
        type: ApplicationCommandOptionType.String,
    };
    public static readonly CC_CREATE_ACTION_OPTION: APIApplicationCommandBasicOption = {
        name: Lang.getRef('arguments.cc-create-action-option', Language.Default),
        name_localizations: Lang.getRefLocalizationMap('arguments.cc-create-action-option'),
        description: Lang.getRef('argDescs.cc-create-action-option', Language.Default),
        description_localizations: Lang.getRefLocalizationMap('argDescs.cc-create-action-option'),
        type: ApplicationCommandOptionType.String,
    };
    public static readonly CC_DELETE_NAME_OPTION: APIApplicationCommandBasicOption = {
        name: Lang.getRef('arguments.cc-delete-name-option', Language.Default),
        name_localizations: Lang.getRefLocalizationMap('arguments.cc-delete-name-option'),
        description: Lang.getRef('argDescs.cc-delete-name-option', Language.Default),
        description_localizations: Lang.getRefLocalizationMap('argDescs.cc-delete-name-option'),
        autocomplete: true,
        type: ApplicationCommandOptionType.String,
    };
    public static readonly CC_FETCH_NAME_OPTION: APIApplicationCommandBasicOption = {
        name: Lang.getRef('arguments.cc-fetch-name-option', Language.Default),
        name_localizations: Lang.getRefLocalizationMap('arguments.cc-fetch-name-option'),
        description: Lang.getRef('argDescs.cc-fetch-name-option', Language.Default),
        description_localizations: Lang.getRefLocalizationMap('argDescs.cc-fetch-name-option'),
        autocomplete: true,
        type: ApplicationCommandOptionType.String,
    };
}
