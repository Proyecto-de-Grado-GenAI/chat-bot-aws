import json
import boto3
from datetime import datetime

def handler(event, context):
    # Create a client for Amazon Bedrock
    client = boto3.client('bedrock-agent')

    try:
        # List the knowledge bases
        response = client.list_knowledge_bases()
        knowledge_bases = response.get('knowledgeBaseSummaries', [])

        # Process the knowledge bases to make the response more readable
        formatted_kbs = []
        for kb in knowledge_bases:
            # Ensure 'updatedAt' is converted to a string if it's a datetime object
            updated_at = kb['updatedAt']
            if isinstance(updated_at, datetime):
                updated_at = updated_at.strftime('%Y-%m-%d %H:%M:%S')
                
            formatted_kbs.append({
                'knowledgeBaseId': kb['knowledgeBaseId'],
                'name': kb['name'],
                'description': kb.get('description', 'No description provided'),
                'status': kb['status'],
                'updatedAt': updated_at
            })

        # Return the formatted list of knowledge bases in the response
        return {
            'statusCode': 200,
            'body': json.dumps(formatted_kbs)
        }

    except Exception as e:
        # Handle errors and return an error message
        return {
            'statusCode': 500,
            'body': json.dumps(f"Error listing knowledge bases: {str(e)}")
        }
