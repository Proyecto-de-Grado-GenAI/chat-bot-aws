import boto3
import json

bedrock = boto3.client(service_name="bedrock-agent")

response = bedrock.create_data_source(
    name='example_data_source',
    knowledgeBaseId='NLQSO67ZYK',
    dataSourceConfiguration={
        's3Configuration': {
            'bucketArn': 'arn:aws:s3:::chat-bot-comprehension-bucket',
            'inclusionPrefixes': [
                'private/us-east-1:8a6a7258-7384-c7ea-c296-3ae0520f64a7/',
            ]
        },
        'type': 'S3'
    },
)
print(response)
