import {
    aws_s3 as s3,
    aws_rds as rds,
    Duration,
    Stack,
    StackProps
} from "aws-cdk-lib";
import {Construct} from 'constructs';
import {ParameterGroup} from "aws-cdk-lib/aws-rds";


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

        const parameterGroup = new rds.ParameterGroup(this, 'onlinePennantDatabaseParameterGroup', {
            engine: rds.DatabaseClusterEngine.AURORA_POSTGRESQL,
            parameters: {
                "rds.force_ssl": "0"
            }
        })

        const coreDatabase = new rds.DatabaseCluster(this, "onlinePennantDatabase", {
            clusterIdentifier: 'online-pennant',
            engine: rds.DatabaseClusterEngine.AURORA_POSTGRESQL,
            writer: rds.ClusterInstance.serverlessV2("onlinePennantWriter"),
            readers:    [
                rds.ClusterInstance.serverlessV2("onlinePennantReader")
            ],
            parameterGroup: parameterGroup,
            credentials: rds.Credentials.fromGeneratedSecret('onlinePennantDatabaseSecret'),
            storageType: rds.DBClusterStorageType.AURORA,
            storageEncrypted: true,
            autoMinorVersionUpgrade: true,
            deletionProtection: true,
        })
    }
}