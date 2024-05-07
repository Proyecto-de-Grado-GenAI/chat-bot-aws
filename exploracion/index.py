import boto3, json
from botocore.config import Config
from chatResponder import ChatResponder
import os
import logging
import re


logger = logging.getLogger()
logger.setLevel("INFO")

bedrock = boto3.client("bedrock-runtime", config=Config(region_name="us-east-1"))

bedrock_agent_runtime = boto3.client(
    service_name="bedrock-agent-runtime",
    region_name="us-east-1",
)

# Query the knowledge base to retrieve the context for the question RAG

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
        context += "Context " + str(contador) + "\n"
        context += i["content"]["text"] + "\n"
        context += f"Source:{str(contador)} " + i["location"]["s3Location"]["uri"] + "\n"
        contador += 1

    question_with_context = f"""{question}\n\n{context}"""
    return question_with_context

# PROMPT DEFINITION by LLM

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



supported_models = {"meta.llama3-8b-instruct-v1:0":define_Llama3_prompt, "meta.llama3-70b-instruct-v1:0":define_Llama3_prompt}

#TODO ADD knowledge base ID to the call , temperature and top_p and max_gen_len to the call and system prompt and number of results knowledge base y botón de si se usa o no la Knowledge base

def bedrockQuestion(history, question, modelId):
    system_prompt = """Eres un agente de inteligencia artificial muy especializado en la arquitectura de software,
    das respuestas en el mismo lenguaje que te preguntan y además tienes acceso a una base de conocimiento 
    con información relevante para responder preguntas relacionadas al ADD 3.0 y que se manifiesta como Context bajo la pregunta que se te realiza,
    además siempre proporcionas en la parte final de tus respuestas la fuente de la información exacta que utilizaste para responder la pregunta.
    En caso de que la información que te proporciono no sea suficiente para responder la pregunta, por favor házmelo saber para poder proporcionarte más información o contexto.
    Recuerda que siempre debes responder en el mismo lenguaje que te preguntan y que debes explicar de una forma detallada y entendible para un arquitecto de software.
    No respondes nada que no sea relacionado a la arquitectura de software y al ADD 3.0.
    """
    
    if modelId in supported_models:
        response_knowledge_base_query = retrieveFromKnowledgeBase(question, "FFUYGR42Y1")["retrievalResults"]
        question_with_context = insertContext(question, response_knowledge_base_query)
        historial = extract_messages_from_chat(history)
        print(historial)
        prompt = supported_models[modelId](historial, system_prompt, question_with_context)
        response = bedrock.invoke_model(
            body=json.dumps(
                {
                    "prompt": prompt,
                    "temperature": 0.5,
                    "top_p": 0.999,
                    "max_gen_len": 2048,
                }
            ),
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
        response = bedrockQuestion(
            event["chatString"],
            event["userInput"]["message"],
            event["userInput"]["model"]["model"],
        )
        chatResponder.publish_agent_message(response)
    except Exception as e:
        print(e)
        chatResponder.publish_agent_message(
            "I'm sorry, I'm having trouble understanding you. Could you please rephrase your question?"
        )

    # Mark metadata as done responding
    chatResponder.publish_agent_stop_responding()

