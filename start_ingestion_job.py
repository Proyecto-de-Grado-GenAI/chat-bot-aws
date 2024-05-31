import boto3
import json
bedrock = boto3.client(service_name='bedrock-agent')

response = bedrock.start_ingestion_job(dataSourceId='HLEOAMNJU7',
                                       knowledgeBaseId='NLQSO67ZYK')
response_body = response.get('ingestionJob')
print(response_body)