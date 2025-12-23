import {
    ApplicationCommandType,
    PermissionFlagsBits,
    PermissionsBitField,
    RESTPostAPIChatInputApplicationCommandsJSONBody,
    RESTPostAPIContextMenuApplicationCommandsJSONBody,
} from 'discord.js';

import { Args } from './index.js';
import { Language } from '../models/enum-helpers/index.js';
import { Lang } from "../services/index.js";

export const ChatCommandMetadata: {
    [command: string]: RESTPostAPIChatInputApplicationCommandsJSONBody;
} = {
    DEV: {
        type: ApplicationCommandType.ChatInput,
        name: Lang.getRef('chatCommands.dev', Language.Default),
        name_localizations: Lang.getRefLocalizationMap('chatCommands.dev'),
        description: Lang.getRef('commandDescs.dev', Language.Default),
        description_localizations: Lang.getRefLocalizationMap('commandDescs.dev'),
        dm_permission: true,
        default_member_permissions: PermissionsBitField.resolve([
            PermissionFlagsBits.Administrator,
        ]).toString(),
        options: [
            {
                ...Args.DEV_COMMAND,
                required: true,
            },
        ],
    },
    HELP: {
        type: ApplicationCommandType.ChatInput,
        name: Lang.getRef('chatCommands.help', Language.Default),
        name_localizations: Lang.getRefLocalizationMap('chatCommands.help'),
        description: Lang.getRef('commandDescs.help', Language.Default),
        description_localizations: Lang.getRefLocalizationMap('commandDescs.help'),
        dm_permission: true,
        default_member_permissions: undefined,
        options: [
            {
                ...Args.HELP_OPTION,
                required: true,
            },
        ],
    },
    INFO: {
        type: ApplicationCommandType.ChatInput,
        name: Lang.getRef('chatCommands.info', Language.Default),
        name_localizations: Lang.getRefLocalizationMap('chatCommands.info'),
        description: Lang.getRef('commandDescs.info', Language.Default),
        description_localizations: Lang.getRefLocalizationMap('commandDescs.info'),
        dm_permission: true,
        default_member_permissions: undefined,
        options: [
            {
                ...Args.INFO_OPTION,
                required: true,
            },
        ],
    },
    TEST: {
        type: ApplicationCommandType.ChatInput,
        name: Lang.getRef('chatCommands.test', Language.Default),
        name_localizations: Lang.getRefLocalizationMap('chatCommands.test'),
        description: Lang.getRef('commandDescs.test', Language.Default),
        description_localizations: Lang.getRefLocalizationMap('commandDescs.test'),
        dm_permission: true,
        default_member_permissions: undefined,
    },
    D20: {
        type: ApplicationCommandType.ChatInput,
        name: Lang.getRef('chatCommands.d20', Language.Default),
        name_localizations: Lang.getRefLocalizationMap('chatCommands.d20'),
        description: Lang.getRef('commandDescs.d20', Language.Default),
        description_localizations: Lang.getRefLocalizationMap('commandDescs.d20'),
        dm_permission: true,
        default_member_permissions: undefined,
    },
    AB: {
        type: ApplicationCommandType.ChatInput,
        name: Lang.getRef('chatCommands.ab', Language.Default),
        name_localizations: Lang.getRefLocalizationMap('chatCommands.ab'),
        description: Lang.getRef('commandDescs.ab', Language.Default),
        description_localizations: Lang.getRefLocalizationMap('commandDescs.ab'),
        dm_permission: true,
        default_member_permissions: undefined,
    },
    JUMP: {
        type: ApplicationCommandType.ChatInput,
        name: Lang.getRef('chatCommands.jump', Language.Default),
        name_localizations: Lang.getRefLocalizationMap('chatCommands.jump'),
        description: Lang.getRef('commandDescs.jump', Language.Default),
        description_localizations: Lang.getRefLocalizationMap('commandDescs.jump'),
        dm_permission: true,
        default_member_permissions: undefined,
    },
    CC_CREATE: {
      type: ApplicationCommandType.ChatInput,
      name: Lang.getRef('chatCommands.cc-create', Language.Default),
      name_localizations: Lang.getRefLocalizationMap('chatCommands.cc-create'),
      description: Lang.getRef('commandDescs.ccCreate', Language.Default),
      description_localizations: Lang.getRefLocalizationMap('commandDescs.ccCreate'),
      dm_permission: true,
      default_member_permissions: undefined,
      options: [
          {
              ...Args.CC_CREATE_NAME_OPTION,
              required: true,
          },
          {
              ...Args.CC_CREATE_ACTION_OPTION,
              required: true
          }
      ],
    },
    CC_DELETE: {
        type: ApplicationCommandType.ChatInput,
        name: Lang.getRef('chatCommands.cc-delete', Language.Default),
        name_localizations:Lang.getRefLocalizationMap('chatCommands.cc-delete'),
        description: Lang.getRef('commandDescs.ccDelete', Language.Default),
        description_localizations: Lang.getRefLocalizationMap('commandDescs.ccDelete'),
        dm_permission: true,
        default_member_permissions: undefined,
        options: [
            {
                ...Args.CC_DELETE_NAME_OPTION,
                required: true
            }
        ]
    },
    CC_FETCH: {
        type: ApplicationCommandType.ChatInput,
        name: Lang.getRef('chatCommands.cc-fetch', Language.Default),
        name_localizations:Lang.getRefLocalizationMap('chatCommands.cc-fetch'),
        description: Lang.getRef('commandDescs.ccFetch', Language.Default),
        description_localizations: Lang.getRefLocalizationMap('commandDescs.ccFetch'),
        dm_permission: true,
        default_member_permissions: undefined,
        options: [
            {
                ...Args.CC_FETCH_NAME_OPTION,
                required: true
            }
        ]
    },
    CC_MINE: {
        type: ApplicationCommandType.ChatInput,
        name: Lang.getRef('chatCommands.cc-mine', Language.Default),
        name_localizations:Lang.getRefLocalizationMap('chatCommands.cc-mine'),
        description: Lang.getRef('commandDescs.ccMine', Language.Default),
        description_localizations: Lang.getRefLocalizationMap('commandDescs.ccMine'),
        dm_permission: true,
        default_member_permissions: undefined,
    },
    FIELDING: {
        type: ApplicationCommandType.ChatInput,
        name: Lang.getRef('chatCommands.fielding', Language.Default),
        name_localizations:Lang.getRefLocalizationMap('chatCommands.fielding'),
        description: Lang.getRef('commandDescs.fielding', Language.Default),
        description_localizations: Lang.getRefLocalizationMap('commandDescs.fielding'),
        default_member_permissions: undefined,
        dm_permission: true,
        options: [
            {
                ...Args.FIELDING_POSITION_OPTION,
                required: true
            }
        ]
    },
    CHART_CREATE: {
        type: ApplicationCommandType.ChatInput,
        name: Lang.getRef('chatCommands.chart-create', Language.Default),
        name_localizations: Lang.getRefLocalizationMap('chatCommands.chart-create'),
        description: Lang.getRef('commandDescs.chartCreate', Language.Default),
        description_localizations: Lang.getRefLocalizationMap('commandDescs.chartCreate'),
        dm_permission: true,
        default_member_permissions: undefined,
        options: [
            {
                ...Args.CHART_CREATE_NAME_OPTION,
                required: true,
            },
            {
                ...Args.CHART_CREATE_TITLE_OPTION,
                required: true
            },
            {
                ...Args.CHART_CREATE_DESCRIPTION_OPTION,
                required: true
            },
            {
                ...Args.CHART_CREATE_IMAGE_LINK_OPTION,
                required: true
            },
        ],
    },
    CHART_DELETE: {
        type: ApplicationCommandType.ChatInput,
        name: Lang.getRef('chatCommands.chart-delete', Language.Default),
        name_localizations:Lang.getRefLocalizationMap('chatCommands.chart-delete'),
        description: Lang.getRef('commandDescs.chartDelete', Language.Default),
        description_localizations: Lang.getRefLocalizationMap('commandDescs.chartDelete'),
        dm_permission: true,
        default_member_permissions: undefined,
        options: [
            {
                ...Args.CHART_DELETE_NAME_OPTION,
                required: true
            }
        ]
    },
    CHART_FETCH: {
        type: ApplicationCommandType.ChatInput,
        name: Lang.getRef('chatCommands.chart-fetch', Language.Default),
        name_localizations:Lang.getRefLocalizationMap('chatCommands.chart-fetch'),
        description: Lang.getRef('commandDescs.chartFetch', Language.Default),
        description_localizations: Lang.getRefLocalizationMap('commandDescs.chartFetch'),
        dm_permission: true,
        default_member_permissions: undefined,
        options: [
            {
                ...Args.CHART_FETCH_NAME_OPTION,
                required: true
            }
        ]
    },
    AB_HISTORY: {
        type: ApplicationCommandType.ChatInput,
        name: Lang.getRef('chatCommands.ab-history', Language.Default),
        name_localizations:Lang.getRefLocalizationMap('chatCommands.ab-history'),
        description: Lang.getRef('commandDescs.abHistory', Language.Default),
        description_localizations: Lang.getRefLocalizationMap('commandDescs.abHistory'),
        dm_permission: true,
        default_member_permissions: undefined,
        options: [
            {
                ...Args.AB_HISTORY_COUNT_OPTION,
                required: true
            },
            {
                ...Args.AB_HISTORY_ROLL_TYPE_OPTION,
                required: true
            }
        ]
    },
    PLAYER_FETCH: {
        type: ApplicationCommandType.ChatInput,
        name: Lang.getRef('chatCommands.player-fetch', Language.Default),
        name_localizations:Lang.getRefLocalizationMap('chatCommands.player-fetch'),
        description: Lang.getRef('commandDescs.playerFetch', Language.Default),
        description_localizations: Lang.getRefLocalizationMap('commandDescs.playerFetch'),
        dm_permission: true,
        default_member_permissions: undefined,
        options: [
            {
                ...Args.PLAYER_FETCH_NAME_OPTION,
                required: true
            }
        ]
    },
    BUTT_STUFF: {
        type: ApplicationCommandType.ChatInput,
        name: Lang.getRef('chatCommands.butt-stuff', Language.Default),
        name_localizations: Lang.getRefLocalizationMap('chatCommands.butt-stuff'),
        description: Lang.getRef('commandDescs.buttStuff', Language.Default),
        description_localizations: Lang.getRefLocalizationMap('commandDescs.buttStuff'),
        dm_permission: true,
        default_member_permissions: undefined,
    },
};

export const MessageCommandMetadata: {
    [command: string]: RESTPostAPIContextMenuApplicationCommandsJSONBody;
} = {
    VIEW_DATE_SENT: {
        type: ApplicationCommandType.Message,
        name: Lang.getRef('messageCommands.viewDateSent', Language.Default),
        name_localizations: Lang.getRefLocalizationMap('messageCommands.viewDateSent'),
        default_member_permissions: undefined,
        dm_permission: true,
    },
};

export const UserCommandMetadata: {
    [command: string]: RESTPostAPIContextMenuApplicationCommandsJSONBody;
} = {
    VIEW_DATE_JOINED: {
        type: ApplicationCommandType.User,
        name: Lang.getRef('userCommands.viewDateJoined', Language.Default),
        name_localizations: Lang.getRefLocalizationMap('userCommands.viewDateJoined'),
        default_member_permissions: undefined,
        dm_permission: true,
    },
};
