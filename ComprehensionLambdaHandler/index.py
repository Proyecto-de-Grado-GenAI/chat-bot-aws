import boto3, json
from botocore.config import Config
from chatResponder import ChatResponder
import re

bedrock = boto3.client("bedrock-runtime", config=Config(region_name="us-east-1"))
bedrock_agent_runtime = boto3.client(
    service_name="bedrock-agent-runtime",
    region_name="us-east-1",
)

def extract_messages_from_chat(chat_string):
    pattern = r"(Human|Assistant): (.*?)\n(?=Human|Assistant|$)"
    matches = re.findall(pattern, chat_string, re.DOTALL)
    messages = [msg.strip() for _, msg in matches]
    messages.pop()
    return messages

def retrieveFromKnowledgeBase(query, kbId, numberOfResults=1):
    return bedrock_agent_runtime.retrieve(
        retrievalQuery={"text": query},
        knowledgeBaseId=kbId,
        retrievalConfiguration={
            "vectorSearchConfiguration": {"numberOfResults": numberOfResults}
        },
    )

def insertContext(question, response_knowledge_base):
    context = ""
    contador = 0
    for i in response_knowledge_base:
        print(i["content"]["text"])
        context += "Context " + str(contador) + "\n"
        context += i["content"]["text"] + "\n"
        context += f"Source:{str(contador)} " + i["location"]["s3Location"]["uri"] + "\n"
        contador += 1

    question_with_context = f"""{question}\n\n{context}"""
    return question_with_context

def define_Llama3_prompt(history,system_prompt, question_with_context):
    SystemPrompt = f"""<|begin_of_text|><|start_header_id|>system<|end_header_id|>\n{system_prompt}<|eot_id|>"""
    waitForAssistantPrompt = f"""<|start_header_id|>assistant<|end_header_id|>"""
    init = SystemPrompt
    for i in range(len(history)):
        if i % 2 == 0:
            init += f"""<|start_header_id|>user<|end_header_id|>\n{history[i]}<|eot_id|>"""
        else:
            init += f"""<|start_header_id|>assistant<|end_header_id|>\n{history[i]}<|eot_id|>"""
    init += f"""<|start_header_id|>user<|end_header_id|>\n{question_with_context}<|eot_id|>"""
    init += waitForAssistantPrompt
    return init

supported_models = {
    "meta.llama3-8b-instruct-v1:0": define_Llama3_prompt,
    "meta.llama3-70b-instruct-v1:0": define_Llama3_prompt
}


model_specific_params = {
    "meta.llama3-8b-instruct-v1:0": {
        "temperature": 0,
        "top_p": 0,
        "max_gen_len": 2048
    },
    "meta.llama3-70b-instruct-v1:0": {
        "temperature": 0.7,
        "top_p": 0.9,
        "max_gen_len": 2048
    }
}

def bedrockQuestion(
    history, question, modelId, model_params=None, 
    system_prompt=None, knowledgeBaseId="FFUYGR42Y1", 
    use_knowledge_base=True, number_of_results=1
):
    if model_params is None:
        model_params = {}
    
    print(f"Model ID: {modelId}")
    print(f"Model Params: {model_params}")
    print(f"System Prompt: {system_prompt}")
    print(f"Knowledge Base ID: {knowledgeBaseId}")
    print(f"Use Knowledge Base: {use_knowledge_base}")
    print(f"Number of Results: {number_of_results}")

    if modelId in supported_models:
        if use_knowledge_base:
            response_knowledge_base_query = retrieveFromKnowledgeBase(question, knowledgeBaseId, numberOfResults=number_of_results)["retrievalResults"]
            question_with_context = insertContext(question, response_knowledge_base_query)
        else:
            question_with_context = question
        
        historial = extract_messages_from_chat(history)
        prompt = supported_models[modelId](historial, system_prompt, question_with_context)
        
        # Use only user-provided params or model-specific params
        params = {**model_specific_params.get(modelId, {}), **model_params}
        print(f"Params: {params}")
        model_invoke_params = {
            "prompt": prompt,
            **params  # Unpack the parameters dictionary directly into model_invoke_params
        }
        print(f"Model Invoke Params: {model_invoke_params}")
        
        response = bedrock.invoke_model(
            body=json.dumps(model_invoke_params),
            modelId=modelId,
        )

        raw_body = response["body"].read().decode("utf-8")
        response_json = json.loads(raw_body)

        return [*response_json.values()][0]
    else:
        return "Model not supported"


def handler(event, context):
    chatResponder = ChatResponder(event["conversationData"]["id"])
    try:
        model_params = event["agentData"]["modelParams"]
        system_prompt = event["agentData"]["systemPrompt"]
        knowledge_base_params = event["agentData"]["knowledgeBaseParams"]

        print(f"event: {event}")
        
        response = bedrockQuestion(
            event["chatString"],
            event["userInput"]["message"],
            event["userInput"]["model"]["model"],
            model_params=model_params,
            system_prompt=system_prompt,
            knowledgeBaseId= knowledge_base_params["knowledgeBaseId"],
            use_knowledge_base= knowledge_base_params["useKnowledgeBase"],
            number_of_results= knowledge_base_params["numberOfResults"]
        )
        
        chatResponder.publish_agent_message(response)
    except Exception as e:
        print(e)
        chatResponder.publish_agent_message(
            "I'm sorry, I'm having trouble understanding you. Could you please rephrase your question?"
        )

    # Mark metadata as done responding
    chatResponder.publish_agent_stop_responding()