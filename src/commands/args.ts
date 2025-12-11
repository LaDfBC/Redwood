import { APIApplicationCommandBasicOption, ApplicationCommandOptionType } from 'discord.js';

import {
  DevCommandName,
  HelpOption,
  InfoOption,
  PositionOption,
} from "../enums/index.js";
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
        ],
    };
    public static readonly CC_CREATE_NAME_OPTION: APIApplicationCommandBasicOption = {
        name: Lang.getRef('arguments.ccCreateNameOption', Language.Default),
        name_localizations: Lang.getRefLocalizationMap('arguments.ccCreateNameOption'),
        description: Lang.getRef('argDescs.ccCreateNameOption', Language.Default),
        description_localizations: Lang.getRefLocalizationMap('argDescs.ccCreateNameOption'),
        type: ApplicationCommandOptionType.String,
    };
    public static readonly CC_CREATE_ACTION_OPTION: APIApplicationCommandBasicOption = {
        name: Lang.getRef('arguments.ccCreateActionOption', Language.Default),
        name_localizations: Lang.getRefLocalizationMap('arguments.ccCreateActionOption'),
        description: Lang.getRef('argDescs.ccCreateActionOption', Language.Default),
        description_localizations: Lang.getRefLocalizationMap('argDescs.ccCreateActionOption'),
        type: ApplicationCommandOptionType.String,
    };
    public static readonly CHART_CREATE_NAME_OPTION: APIApplicationCommandBasicOption = {
        name: Lang.getRef('arguments.chartCreateNameOption', Language.Default),
        name_localizations: Lang.getRefLocalizationMap('arguments.chartCreateNameOption'),
        description: Lang.getRef('argDescs.chartCreateNameOption', Language.Default),
        description_localizations: Lang.getRefLocalizationMap('argDescs.chartCreateNameOption'),
        type: ApplicationCommandOptionType.String,
    };
    public static readonly CHART_CREATE_TITLE_OPTION: APIApplicationCommandBasicOption = {
        name: Lang.getRef('arguments.chartCreateTitleOption', Language.Default),
        name_localizations: Lang.getRefLocalizationMap('arguments.chartCreateTitleOption'),
        description: Lang.getRef('argDescs.chartCreateTitleOption', Language.Default),
        description_localizations: Lang.getRefLocalizationMap('argDescs.chartCreateTitleOption'),
        type: ApplicationCommandOptionType.String,
    };
    public static readonly CHART_CREATE_DESCRIPTION_OPTION: APIApplicationCommandBasicOption = {
        name: Lang.getRef('arguments.chartCreateDescriptionOption', Language.Default),
        name_localizations: Lang.getRefLocalizationMap('arguments.chartCreateDescriptionOption'),
        description: Lang.getRef('argDescs.chartCreateDescriptionOption', Language.Default),
        description_localizations: Lang.getRefLocalizationMap('argDescs.chartCreateDescriptionOption'),
        type: ApplicationCommandOptionType.String,
    };
    public static readonly CHART_CREATE_IMAGE_LINK_OPTION: APIApplicationCommandBasicOption = {
        name: Lang.getRef('arguments.chartCreateImageLinkOption', Language.Default),
        name_localizations: Lang.getRefLocalizationMap('arguments.chartCreateImageLinkOption'),
        description: Lang.getRef('argDescs.chartCreateImageLinkOption', Language.Default),
        description_localizations: Lang.getRefLocalizationMap('argDescs.chartCreateImageLinkOption'),
        type: ApplicationCommandOptionType.String,
    };
    public static readonly CC_DELETE_NAME_OPTION: APIApplicationCommandBasicOption = {
        name: Lang.getRef('arguments.ccDeleteNameOption', Language.Default),
        name_localizations: Lang.getRefLocalizationMap('arguments.ccDeleteNameOption'),
        description: Lang.getRef('argDescs.ccDeleteNameOption', Language.Default),
        description_localizations: Lang.getRefLocalizationMap('argDescs.ccDeleteNameOption'),
        autocomplete: true,
        type: ApplicationCommandOptionType.String,
    };
    public static readonly CC_FETCH_NAME_OPTION: APIApplicationCommandBasicOption = {
        name: Lang.getRef('arguments.ccFetchNameOption', Language.Default),
        name_localizations: Lang.getRefLocalizationMap('arguments.ccFetchNameOption'),
        description: Lang.getRef('argDescs.ccFetchNameOption', Language.Default),
        description_localizations: Lang.getRefLocalizationMap('argDescs.ccFetchNameOption'),
        autocomplete: true,
        type: ApplicationCommandOptionType.String,
    };
    public static readonly CHART_DELETE_NAME_OPTION: APIApplicationCommandBasicOption = {
        name: Lang.getRef('arguments.chartDeleteNameOption', Language.Default),
        name_localizations: Lang.getRefLocalizationMap('arguments.chartDeleteNameOption'),
        description: Lang.getRef('argDescs.chartDeleteNameOption', Language.Default),
        description_localizations: Lang.getRefLocalizationMap('argDescs.chartDeleteNameOption'),
        autocomplete: true,
        type: ApplicationCommandOptionType.String,
    };
    public static readonly CHART_FETCH_NAME_OPTION: APIApplicationCommandBasicOption = {
        name: Lang.getRef('arguments.chartFetchNameOption', Language.Default),
        name_localizations: Lang.getRefLocalizationMap('arguments.chartFetchNameOption'),
        description: Lang.getRef('argDescs.chartFetchNameOption', Language.Default),
        description_localizations: Lang.getRefLocalizationMap('argDescs.chartFetchNameOption'),
        autocomplete: true,
        type: ApplicationCommandOptionType.String,
    };
    public static readonly FIELDING_POSITION_OPTION: APIApplicationCommandBasicOption = {
        name: Lang.getRef('arguments.fieldingPositionOption', Language.Default),
        name_localizations: Lang.getRefLocalizationMap('arguments.fieldingPositionOption'),
        description: Lang.getRef('argDescs.fieldingPositionOption', Language.Default),
        description_localizations: Lang.getRefLocalizationMap('argDescs.fieldingPositionOption'),
        choices: [
            {
                name: Lang.getRef('positionOptions.catcher', Language.Default),
                name_localizations: Lang.getRefLocalizationMap('positionOptions.catcher'),
                value: PositionOption.CATCHER,
            },
            {
                name: Lang.getRef('positionOptions.pitcher', Language.Default),
                name_localizations: Lang.getRefLocalizationMap('positionOptions.pitcher'),
                value: PositionOption.PITCHER,
            },
            {
                name: Lang.getRef('positionOptions.firstBase', Language.Default),
                name_localizations: Lang.getRefLocalizationMap('positionOptions.firstBase'),
                value: PositionOption.FIRST_BASE,
            },
            {
                name: Lang.getRef('positionOptions.secondBase', Language.Default),
                name_localizations: Lang.getRefLocalizationMap('positionOptions.secondBase'),
                value: PositionOption.SECOND_BASE,
            },
            {
                name: Lang.getRef('positionOptions.shortstop', Language.Default),
                name_localizations: Lang.getRefLocalizationMap('positionOptions.shortstop'),
                value: PositionOption.SHORTSTOP,
            },
            {
                name: Lang.getRef('positionOptions.thirdBase', Language.Default),
                name_localizations: Lang.getRefLocalizationMap('positionOptions.thirdBase'),
                value: PositionOption.THIRD_BASE,
            },
            {
                name: Lang.getRef('positionOptions.rightField', Language.Default),
                name_localizations: Lang.getRefLocalizationMap('positionOptions.rightField'),
                value: PositionOption.RIGHT_FIELD,
            },
            {
                name: Lang.getRef('positionOptions.centerField', Language.Default),
                name_localizations: Lang.getRefLocalizationMap('positionOptions.centerField'),
                value: PositionOption.CENTER_FIELD,
            },
            {
                name: Lang.getRef('positionOptions.leftField', Language.Default),
                name_localizations: Lang.getRefLocalizationMap('positionOptions.leftField'),
                value: PositionOption.LEFT_FIELD,
            },

        ],
        type: ApplicationCommandOptionType.String,
    };
}
