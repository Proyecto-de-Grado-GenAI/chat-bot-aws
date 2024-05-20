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


def summarize_and_combine_history_with_llama(history, question, modelId):

    model_params = {
        "temperature": 0.7,
        "top_p": 0.9,
        "max_gen_len": 1000
    }

    user_prompt = ""

    
    history = history[2:] 
    for i in range(len(history)):
        if i % 2 == 0:
            user_prompt += f"Human: {history[i]}\n"
        else:
            user_prompt += f"Assistant: {history[i]}\n"

    

    user_prompt += f"Human: {question}\n"

    system_prompt = """### System Prompt **Instrucciones del Sistema:**

Eres un modelo de lenguaje cuya única función es:

1. **Analizar preguntas del usuario:**
   - Escucha las interacciones entre el asistente y el usuario.
   - Examina cada pregunta realizada por el usuario.
   - Formula la mejor pregunta posible para consultar una base de datos vectorial y obtener la información más relevante.

**Restricciones Estrictas:**
- **No responder mensajes que no contengan preguntas:** Ignora mensajes que no contengan una pregunta específica.
- **No responder preguntas directamente:** No debes proporcionar respuestas directas al usuario.
- **Limitación a la función específica:** Tu única salida debe ser la formulación optimizada de la pregunta del usuario.
- **Formato de salida:** La pregunta reformulada debe estar entre caracteres específicos para asegurar su extracción. Utiliza el formato `@@pregunta@@`.
- **Prohibición de inventar información:** Solo puedes usar la información proporcionada en la conversación. Está estrictamente prohibido inventar cualquier dato o información.

**Directrices Específicas:**
- **Análisis de preguntas:** Identifica la intención detrás de la pregunta del usuario y reformúlala para optimizar la búsqueda en la base de datos vectorial.
- **Objetividad de preguntas:** La pregunta reformulada debe ser clara y directamente relacionada con lo que el usuario pregunta, manteniéndose objetiva y precisa.
- **Complejidad de preguntas:** La pregunta reformulada debe ser lo suficientemente detallada para generar fragmentos de respuesta relevantes dentro de 1000 caracteres.

**Ejemplo de Salida:**
- Si el usuario pregunta: "¿Cuál es la capital de Francia?"
- Tu salida debería ser: `@@¿Cuál es la ciudad que actualmente sirve como la capital de Francia?@@`
"""

    system_prompt_formatted = f"""<|begin_of_text|><|start_header_id|>system<|end_header_id|>\n{system_prompt}<|eot_id|>"""
    user_prompt_formatted = f"""<|start_header_id|>user<|end_header_id|>\n{user_prompt}<|eot_id|>"""
    waitForAssistantPrompt = f"""<|start_header_id|>assistant<|end_header_id|>"""

    final_prompt = system_prompt_formatted + user_prompt_formatted + waitForAssistantPrompt

    model_invoke_params = {
        "prompt": final_prompt,
        **model_params
    }

    

    response = bedrock.invoke_model(
        body=json.dumps(model_invoke_params),
        modelId=modelId,
    )

    raw_body = response["body"].read().decode("utf-8")
    response_json = json.loads(raw_body)
    try :
        respuesta = [*response_json.values()][0]
        respuesta = respuesta.split("@@")[1]
        print(f"Respuesta: {respuesta}")
    except Exception as e:
        respuesta = False
    finally:
        return respuesta


def insertContext(question, response_knowledge_base, variables=None):
    context = ""
    contador = 0
    for i in response_knowledge_base:
        print(i["content"]["text"])
        context += "Context " + str(contador) + "\n"
        context += i["content"]["text"] + "\n"
        context += f"Source:{str(contador)} " + i["location"]["s3Location"]["uri"] + "\n"
        contador += 1

    variables_section = "\n### Special Variables:\n"
    for variable in variables:
        variables_section += f"**{variable['name']}**: {variable['value']}\n"

    variables_section += "end of variables\n"
    question_with_context = f"""Special Question: {question}\n end of question\n Special Variables: {variables_section}\n end of variables\n Extra Information:\n {context}\n end of extra information\n"""
    return question_with_context




def define_Llama3_prompt(history,system_prompt, question_with_context_variables):
    SystemPrompt = f"""<|begin_of_text|><|start_header_id|>system<|end_header_id|>\n{system_prompt}<|eot_id|>"""
    waitForAssistantPrompt = f"""<|start_header_id|>assistant<|end_header_id|>"""
    init = SystemPrompt
    for i in range(len(history)):
        if i % 2 == 0:
            init += f"""<|start_header_id|>user<|end_header_id|>\n{history[i]}<|eot_id|>"""
        else:
            init += f"""<|start_header_id|>assistant<|end_header_id|>\n{history[i]}<|eot_id|>"""

    init += f"""<|start_header_id|>user<|end_header_id|>\n{question_with_context_variables}<|eot_id|>"""
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
    use_knowledge_base=True, number_of_results=1, variables=None	
):
    if model_params is None:
        model_params = {}
    

    if modelId in supported_models:
        
        historial = extract_messages_from_chat(history)
        print(f"Historial: {historial}")
        
        if use_knowledge_base:
            query_knowledge_base = summarize_and_combine_history_with_llama(historial,question,"meta.llama3-70b-instruct-v1:0")
            print(f"Query Knowledge Base: {query_knowledge_base}")
            print("test")
            if query_knowledge_base :
                response_knowledge_base_query = retrieveFromKnowledgeBase(query_knowledge_base, knowledgeBaseId, number_of_results)["retrievalResults"]
                question_with_context = insertContext(question, response_knowledge_base_query,variables)
            else:
                question_with_context = f"Special Question: {question} \n No Knowledge Base used and No variables used"
        else:
            question_with_context = f"Special Question: {question} \n No Knowledge Base used and No variables used"
        print(f"Question with context: {question_with_context}")

        prompt = supported_models[modelId](historial, system_prompt, question_with_context)
        
        params = {**model_specific_params.get(modelId, {}), **model_params}
        print(f"Params: {params}")
        model_invoke_params = {
            "prompt": prompt,
            **params  
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
        
        # Acceder a las variables y convertirlas en una lista
        variables = event["userInput"]["variables"]
        variables_list = [{"name": var["name"], "value": var["value"]} for var in variables]

        print(variables_list)
    
        response = bedrockQuestion(
            event["chatString"],
            event["userInput"]["message"],
            event["userInput"]["model"]["model"],
            model_params=model_params,
            system_prompt=system_prompt,
            knowledgeBaseId= knowledge_base_params["knowledgeBaseId"],
            use_knowledge_base= knowledge_base_params["useKnowledgeBase"],
            number_of_results= knowledge_base_params["numberOfResults"],
            variables=variables_list  # Pasar la lista de variables
        )
        
        chatResponder.publish_agent_message(response)
    except Exception as e:
        print(e)
        chatResponder.publish_agent_message(
            "I'm sorry, I'm having trouble understanding you. Could you please rephrase your question?"
        )

    chatResponder.publish_agent_stop_responding()
