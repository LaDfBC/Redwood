import {
    Stack,
    pipelines,
    aws_iam as iam,
} from 'aws-cdk-lib'

const { CodePipeline, CodePipelineSource, ShellStep } = pipelines
import {Construct} from "constructs";
import * as cdk from "aws-cdk-lib";
import { RedwoodBotStage } from "./app-stage.js"

export class CodepipelineStack extends Stack {
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props)

        const params = {
            repo: 'LaDfBC/Redwood',
            branch: 'master',
        };

        const connectionArn = 'arn:aws:codeconnections:us-east-2:023487918592:connection/b784305d-f57e-446b-b92e-86b8903fddb6'

        const { repo, branch } = params

        const pipeline = new CodePipeline(this, 'Pipeline', {
            dockerEnabledForSynth: true,
            synth: new ShellStep('Synth', {
                input: CodePipelineSource.connection(repo, branch, { connectionArn }),
                commands: ['npm ci', 'npx cdk synth'],
            }),
            synthCodeBuildDefaults: {
                rolePolicy: [
                    new iam.PolicyStatement({
                        effect: iam.Effect.ALLOW,
                        actions: ['sts:AssumeRole', 'iam:PassRole'],
                        resources: ['arn:aws:iam::*:role/cdk-*'],
                    })
                ],

            },
        })

        // The first stage is added after we started using nested stacks so it includes the one that needs to be first
        pipeline.addStage(new RedwoodBotStage(this, 'redwood-bot', props))
        pipeline.buildPipeline()
    }
}