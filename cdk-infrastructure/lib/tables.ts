import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { DynamoDBSeeder, Seeds } from '@cloudcomponents/cdk-dynamodb-seeder';
import { Construct } from 'constructs';
import { DynamoDBSeederProps } from '@cloudcomponents/cdk-dynamodb-seeder';

export function buildTables(scope: Construct) {
    // Agents table
    const agentTable = new dynamodb.Table(scope, 'MyAgentsDDBTable', {
        partitionKey: {
            name: 'id',
            type: dynamodb.AttributeType.STRING
        },
    });

    // Conversations table
    const conversationTable = new dynamodb.Table(scope, 'MyConversationsDDBTable', {
        partitionKey: {
            name: 'id',
            type: dynamodb.AttributeType.STRING
        },
    });

    // Events table
    const eventTable = new dynamodb.Table(scope, 'MyEventsDDBTable', {
        partitionKey: {
            name: 'conversationId',
            type: dynamodb.AttributeType.STRING
        },
        sortKey: {
            name: 'id',
            type: dynamodb.AttributeType.STRING
        }
    });

    // LLm table
    const LLmTable = new dynamodb.Table(scope, 'MyLLmsDDBTable', {
        partitionKey: {
            name: 'id',
            type: dynamodb.AttributeType.STRING
        },
    });

    // Seeder properties for LLmTable
    const LLmSeederProps: DynamoDBSeederProps = {
        table: LLmTable,
        seeds: Seeds.fromInline([
            {
                id: '1',
                name: 'LLama-3-70B',
                model: 'meta.llama3-70b-instruct-v1:0',
            },
            {
                id: '2',
                name: 'LLama-3-8B',
                model: 'meta.llama3-8b-instruct-v1:0',
            },
        ]),
    };
    
    // Seeder AgentTable
    // const AgentSeederProps: DynamoDBSeederProps = {
    //     table: agentTable,
    //     seeds: Seeds.fromInline([
    //         {
    //             id: '1',
    //             name: 'Exploración',
    //             handlerLambda: 'arn:aws:lambda:us-west-2:123456789012:function:exploracion',
            
    //     ]),
    // };

    // Apply seeder to the LLm table
    new DynamoDBSeeder(scope, 'SeedLLmTable', LLmSeederProps);

    // Export table names
    new cdk.CfnOutput(scope, 'agents-table', { exportName: 'agents-table', value: agentTable.tableName });
    new cdk.CfnOutput(scope, 'conversations-table', { exportName: 'conversations-table', value: conversationTable.tableName });
    new cdk.CfnOutput(scope, 'events-table', { exportName: 'events-table', value: eventTable.tableName });
    new cdk.CfnOutput(scope, 'LLm-table', { exportName: 'LLm-table', value: LLmTable.tableName });

    // Return tables for use in other constructs
    return {
        agentTable,
        conversationTable,
        eventTable,
        LLmTable
    };
}
