import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';

import { Construct } from 'constructs';

export function buildTables (scope: Construct) {

	// Agents table - for the list of agents 
	const agentTable = new dynamodb.Table(scope, 'MyAgentsDDBTable', {
		partitionKey: {
			name: 'id',
			type: dynamodb.AttributeType.STRING
		},
	})
	

	// Conversations table - to store the collection of available conversations
	const conversationTable = new dynamodb.Table(scope, 'MyConversationsDDBTable', {
		partitionKey: {
			name: 'id',
			type: dynamodb.AttributeType.STRING
		},
	})

	// Events table - for the list of events, each conversation owning a collection of these
	const eventTable = new dynamodb.Table(scope, 'MyEventsDDBTable', {
		partitionKey: {
			name: 'conversationId',
			type: dynamodb.AttributeType.STRING
		},
		sortKey: {
			name: 'id',
			type: dynamodb.AttributeType.STRING
		}
	})
	// LLm table - for the list of events, each conversation owning a collection of these
	const LLmTable = new dynamodb.Table(scope, 'MyLLmsDDBTable', {
		partitionKey: {
			name: 'id',
			type: dynamodb.AttributeType.STRING
		},
	})

	// Export the values

    new cdk.CfnOutput(scope, 'agents-table', { exportName: 'agents-table', value: agentTable.tableName })
	new cdk.CfnOutput(scope, 'conversations-table', { exportName: 'conversations-table', value: conversationTable.tableName })
	new cdk.CfnOutput(scope, 'events-table', { exportName: 'events-table', value: eventTable.tableName })
	new cdk.CfnOutput(scope, 'LLm-table', { exportName: 'LLm-table', value: LLmTable.tableName })

	// Expose tables to other constructs that need to be build
	return {
		agentTable,
		conversationTable,
		eventTable,
		LLmTable
	}
}