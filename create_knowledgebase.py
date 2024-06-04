import boto3
import re

name_knowledgebase="j.mendezm"
cleaned_username = ''.join([char for char in name_knowledgebase if re.match(r'[0-9a-zA-Z_-]', char)])


bedrock = boto3.client(service_name="bedrock-agent")

response = bedrock.create_knowledge_base(
    description='Knowledgebase for' + cleaned_username,
    knowledgeBaseConfiguration={
        'type': 'VECTOR',
        'vectorKnowledgeBaseConfiguration': {
            'embeddingModelArn': 'arn:aws:bedrock:us-east-1::foundation-model/amazon.titan-embed-text-v1'
        }
    },
    name=cleaned_username+"-knowledgebase",
    roleArn="arn:aws:iam::594491365491:role/service-role/AmazonBedrockExecutionRoleForKnowledgeBase_zuqir",
    storageConfiguration={
        'type': 'OPENSEARCH_SERVERLESS',
        "opensearchServerlessConfiguration": {
            "collectionArn": "arn:aws:aoss:us-east-1:594491365491:collection/8wrvrdyju44sv3qgup2j",
            "fieldMapping": {
                "metadataField": "AMAZON_BEDROCK_METADATA",
                "textField": "AMAZON_BEDROCK_TEXT_CHUNK",
                "vectorField": "bedrock-knowledge-base-default-vector",
            },
            "vectorIndexName": "bedrock-knowledge-base-default-index", 
        },
    },
)