import {
    aws_s3 as s3,
    Stack,
    StackProps
} from "aws-cdk-lib";
import {Construct} from 'constructs';


/**
 * Creates a sample Discord bot endpoint that can be used.
 */
export class DiscordBotStack extends Stack {
    /**
     * The constructor for building the stack.
     * @param {Construct} scope The Construct scope to create the stack in.
     * @param {string} id The ID of the stack to use.
     */
    constructor(scope: Construct, id: string, props?: StackProps) {
        super(scope, id, props);

        const playerBucket = new s3.Bucket(this, 'playerBucket', {
            bucketName: 'online-pennant-player-bucket'
        });
    }
}