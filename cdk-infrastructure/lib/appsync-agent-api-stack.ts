import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { buildFoundationModelHandler, buildCognitoAuth, buildAgentApi, buildTables } from '.';
import { buildCustomLambda } from './handler-lambda-custom';
import { S3ComprehensionBucket } from './S3-comprehension-bucket';

export class AppsyncAgentAPIStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        // First we need to build the dynamodb tables we will need storing and managing configs
        // These tables are consumed by the apis to store metadata and conversation data
        const tables = buildTables(this);

        // S3 Configuration for storage
        const s3Comprehension = S3ComprehensionBucket(this);

        // We also need to build a user pool for the auth flow
        const cognito = buildCognitoAuth(this, s3Comprehension.bucketArn);

        // Next we will build a "agent api", this api manages the actual communication with the agents
        // and the invocation of agent handlers that is where custom LLM business logic lives
        // Inside we define resolvers to handle this interaction
        const agentApi = buildAgentApi(this, { cognito, tables, enableConstructingAgents: true });


        const ExplorationLambdaHandler = buildFoundationModelHandler(this, { 
            agentApi, 
            lambdaPath: 'ExplorationLambdaHandler' 
        });

        const DesignLambdaHandler = buildFoundationModelHandler(this, { 
            agentApi, 
            lambdaPath: 'DesignLambdaHandler' 
        });

        const ComprehensionLambdaHandler = buildFoundationModelHandler(this, { 
            agentApi, 
            lambdaPath: 'ComprehensionLambdaHandler' 
        });

        const checkKnowledgeBaseHandler = buildCustomLambda(this, { lambdaPath: 'checkKnowledgeBaseHandler', userPool: cognito });

        new cdk.CfnOutput(this, 'Region', { value: this.region });
    }
}
