import * as cdk from 'aws-cdk-lib';
import * as awsAppsync from 'aws-cdk-lib/aws-appsync';
import * as path from 'path';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as iam from 'aws-cdk-lib/aws-iam';

import { Construct } from 'constructs';
import { addJsResolver } from './appsync-js-functions';

interface AgentApiProps {
    enableConstructingAgents: boolean;
    cognito: cognito.UserPool;
    tables: {
        agentTable: dynamodb.ITable;
        conversationTable: dynamodb.ITable;
        eventTable: dynamodb.ITable;
        LLmTable: dynamodb.ITable;
        iterationTable: dynamodb.ITable;
    };
}

export function buildAgentApi(scope: Construct, props: AgentApiProps) {

    // We build an appsync api
    const appsyncApi = new awsAppsync.GraphqlApi(scope, 'AgentAppsyncApi', {
        name: 'AI-Agent-Playground-AgentApi',
        schema: awsAppsync.SchemaFile.fromAsset(
            path.join(__dirname, './schema.graphql')
        ),
        authorizationConfig: {
            defaultAuthorization: {
                authorizationType: awsAppsync.AuthorizationType.USER_POOL,
                userPoolConfig: {
                    userPool: props.cognito
                }
            },
            additionalAuthorizationModes: [{
                authorizationType: awsAppsync.AuthorizationType.IAM,
            }]
        },
        logConfig: {
            fieldLogLevel: awsAppsync.FieldLogLevel.ALL,
        },
    });

    

    // We add the data sources for tables to this api
    const agentTableDS = appsyncApi.addDynamoDbDataSource('AgentTable', props.tables.agentTable);
    const LLMTableDS = appsyncApi.addDynamoDbDataSource('LLMTable', props.tables.LLmTable);
    const conversationTableDS = appsyncApi.addDynamoDbDataSource('ConversationTable', props.tables.conversationTable);
    const eventsTableDS = appsyncApi.addDynamoDbDataSource('EventsTable', props.tables.eventTable);
    const IterationTableDS = appsyncApi.addDynamoDbDataSource('IterationTable', props.tables.iterationTable);
    const noneDS = appsyncApi.addNoneDataSource('NoneDataSource');

    // Also one for lambda invoke through http, a bit more involved to setup
    const lambdaInvokerRole = new iam.Role(scope, 'lambda-http-role', {
        assumedBy: new iam.ServicePrincipal('appsync.amazonaws.com')
    });
    const deployRegion = new cdk.Stack(scope).region;
    const HttpDataSource = appsyncApi.addHttpDataSource('lambdaFunctionHttp', `https://lambda.${deployRegion}.amazonaws.com`, {
        authorizationConfig: {
            signingRegion: deployRegion,
            signingServiceName: 'lambda'
        },
    });
    HttpDataSource.ds.serviceRoleArn = lambdaInvokerRole.roleArn;

    // Then build resolvers with JS runtime for aws appsync

    // READ on agents
    addJsResolver(scope, appsyncApi, 'Query.getAgent', { code: 'get', dataSource: agentTableDS });
    addJsResolver(scope, appsyncApi, 'Query.listAgents', { code: 'scan', dataSource: agentTableDS });

    // READ on LLMs
    addJsResolver(scope, appsyncApi, 'Query.getLLm', { code: 'get', dataSource: LLMTableDS });
    addJsResolver(scope, appsyncApi, 'Query.listLLms', { code: 'scan', dataSource: LLMTableDS });
    // CRUD on LLMs
    addJsResolver(scope, appsyncApi, 'Mutation.createLLm', { code: 'create', dataSource: LLMTableDS });
    addJsResolver(scope, appsyncApi, 'Mutation.deleteLLm', { code: 'delete', dataSource: LLMTableDS });

    // CRUD on conversations
    addJsResolver(scope, appsyncApi, 'Query.getConversation', { code: 'get', dataSource: conversationTableDS });
    addJsResolver(scope, appsyncApi, 'Query.listConversations', { code: 'scan', dataSource: conversationTableDS });
    addJsResolver(scope, appsyncApi, 'Mutation.createConversation', { code: 'create', dataSource: conversationTableDS });
    addJsResolver(scope, appsyncApi, 'Mutation.deleteConversation', { code: 'delete', dataSource: conversationTableDS });

    // CRUD on Iterations
    addJsResolver(scope, appsyncApi, 'Query.getIteration', { code: 'get', dataSource: IterationTableDS });
    addJsResolver(scope, appsyncApi, 'Query.listIterations', { code: 'scan', dataSource: IterationTableDS });
    addJsResolver(scope, appsyncApi, 'Mutation.createIteration', { code: 'create', dataSource: IterationTableDS });
    addJsResolver(scope, appsyncApi, 'Mutation.deleteIteration', { code: 'delete', dataSource: IterationTableDS });

    addJsResolver(scope, appsyncApi, 'Mutation.updateIteration', { code: 'update', dataSource: IterationTableDS });
    addJsResolver(scope, appsyncApi, 'Mutation.updateAgent', { code: 'update', dataSource: agentTableDS });


    // Add resolver for updating agents

    

    // Agent gets special resolvers to publish events to clients
    addJsResolver(scope, appsyncApi, 'Mutation.agentPublishEvent', {
        code: 'createTimeId',
        dataSource: eventsTableDS,
    });

    addJsResolver(scope, appsyncApi, 'Mutation.agentPublishMetadata', {
        code: 'Mutation.agentPublishMetadata',
        dataSource: noneDS,
    });

    // Users get special ability to publish events to agents, this one is more involved
    addJsResolver(scope, appsyncApi, 'Mutation.userPublishMessage', [
        {
            code: 'Query.userPublishMessage.getConvo',
            dataSource: conversationTableDS,
        },
        {
            code: 'Query.userPublishMessage.getEvents',
            dataSource: eventsTableDS,
        },
        {
            code: 'Query.userPublishMessage.getAgent',
            dataSource: agentTableDS,
        },
        {
            code: 'Query.userPublishMessage.recordMessage',
            dataSource: eventsTableDS,
        },
        {
            code: 'Query.userPublishMessage.buildHistory',
            dataSource: noneDS,
        },
        {
            code: 'Query.userPublishMessage.invokeLambda',
            dataSource: HttpDataSource,
        }
    ]);

    // If we want to add resolvers for creating and deleting agents and actions
    if (props.enableConstructingAgents) {
        addJsResolver(scope, appsyncApi, 'Mutation.createAgent', { code: 'create', dataSource: agentTableDS });
        addJsResolver(scope, appsyncApi, 'Mutation.deleteAgent', { code: 'delete', dataSource: agentTableDS });
    }

    // Add resolver for updating agents
    
    

    // Finally some more general metadata linkage
    addJsResolver(scope, appsyncApi, 'Conversation.events', {
        code: 'Conversation.events',
        dataSource: eventsTableDS
    });

    // Setup exports
    new cdk.CfnOutput(scope, 'agent-api-endpoint', { exportName: 'agent-api-endpoint', value: appsyncApi.graphqlUrl });
    new cdk.CfnOutput(scope, 'enable-constructing-agents', { exportName: 'enable-constructing-agents', value: props.enableConstructingAgents ? "true" : "false" });

    return {
        appsyncApi,
        lambdaInvokerRole
    };
}
