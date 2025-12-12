import { Stage } from 'aws-cdk-lib'
import {Construct} from "constructs";
import * as cdk from "aws-cdk-lib";
import {DiscordBotStack} from "./discord-bot-stack.js";

class RedwoodBotStage extends Stage {
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props)

        new DiscordBotStack(this, 'discord-bot-stack', props)
    }
}

export { RedwoodBotStage }