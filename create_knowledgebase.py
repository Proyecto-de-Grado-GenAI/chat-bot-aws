import boto3
import json

bedrock = boto3.client(service_name="bedrock-agent")

response = bedrock.create_knowledge_base(
    description='This is a description',
    knowledgeBaseConfiguration={
        'type': 'VECTOR',
        'vectorKnowledgeBaseConfiguration': {
            'embeddingModelArn': 'arn:aws:bedrock:us-east-1::foundation-model/amazon.titan-embed-text-v1'
        }
    },
    name="example-knowledgebase",
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
print(response)
