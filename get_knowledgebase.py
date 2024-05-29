import boto3
import json
bedrock = boto3.client(service_name='bedrock-agent')

response = bedrock.get_knowledge_base(knowledgeBaseId='EE2N7BXQN1')

response_body = response.get('knowledgeBase')
print(response_body)