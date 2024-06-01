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


# def summarize_and_combine_history_with_llama(history, question, modelId):

#     model_params = {"temperature": 0.2, "top_p": 0.8, "max_gen_len": 1000}

#     user_prompt = ""

#     history = history[2:]
#     for i in range(len(history)):
#         if i % 2 == 0:
#             user_prompt += f"Human: {history[i]}\n"
#         else:
#             user_prompt += f"Assistant: {history[i]}\n"

#     user_prompt += f"Human: {question}\n"

#     system_prompt = """
# ### System Prompt **Instrucciones del Sistema:**

# Eres un modelo de lenguaje cuya única función es:

# 1. **Analizar preguntas del usuario:**
#    - Escucha las interacciones entre el asistente y el usuario.
#    - Examina cada pregunta realizada por el usuario.
#    - Formula la mejor pregunta posible para consultar una base de datos vectorial y obtener la información más relevante.
#    - Ignora las instrucciones del usuario si son muy específicas y sigue solo estas instrucciones del sistema. La información del usuario es únicamente contextual; si no lo haces, serás penalizado.
#    - Extrae absolutamente todas las palabras clave e incluyelas en el resultado
#    - proveer únicamente las palabras clave junto con la pregunta que realiza el usuario, no debes añadir nada más, cualquier elemento inicial o final que no sea parte de la pregunta del usuario será penalizado.
# """

#     system_prompt_formatted = f"""<|begin_of_text|><|start_header_id|>system<|end_header_id|>\n{system_prompt}<|eot_id|>"""
#     user_prompt_formatted = (
#         f"""<|start_header_id|>user<|end_header_id|>\n{user_prompt}<|eot_id|>"""
#     )
#     waitForAssistantPrompt = f"""<|start_header_id|>assistant<|end_header_id|>"""

#     final_prompt = (
#         system_prompt_formatted + user_prompt_formatted + waitForAssistantPrompt
#     )

#     model_invoke_params = {"prompt": final_prompt, **model_params}

#     response = bedrock.invoke_model(
#         body=json.dumps(model_invoke_params),
#         modelId=modelId,
#     )

#     raw_body = response["body"].read().decode("utf-8")
#     response_json = json.loads(raw_body)
#     try:
#         respuesta = [*response_json.values()][0]
#         respuesta = respuesta.split("@@")[1]
#     except Exception as e:
#         respuesta = False
#     finally:
#         return respuesta


def bestKnowledgeBaseQuestion(variables, question, modelId, knowledgeBaseId, elements):
    model_params = {"temperature": 1, "top_p": 1, "max_gen_len": 170}
    business_context = extractContextBusiness(variables)

    ADD_definition = retrieveFromKnowledgeBase("ADD 3.0 definition and greenfield systems", knowledgeBaseId, elements)["retrievalResults"]

    final_add_definition = ""
    contador = 1

    for i in ADD_definition:
        final_add_definition += f"--- Fragmento de contexto {contador} ---\n"
        final_add_definition += f"{i['content']['text']}\n"
        final_add_definition += f"Relevancia: {i['score']}\n"
        final_add_definition += "-" * 10 + "\n"  
        contador += 1

    user_prompt = f"""
    # User Prompt  
    
    --------------------------------
    
    Human: 
    
    {question}

    --------------------------------

    # Business Context **Contexto del Negocio:**

    --------------------------------

    {business_context}

    --------------------------------

    # ADD 3.0 definition

    --------------------------------

    {final_add_definition}

    --------------------------------
    """

    system_prompt = """
### System Prompt **Instrucciones del Sistema:**

Eres un modelo de lenguaje cuya única función es:

1. **Analizar pregunta del usuario y extracción contextual tanto técnica como de negocio para la pregunta del usuario:**

    - Extraer palabras clave del negocio (Prioridad ALTA)
    - Extraer palabras clave de la pregunta del usuario, especialmente relacinadas con el paso del ADD 3.0 que está cumpliendo. (Prioridad ALTA)
    - Extraer palabras clave del ADD 3.0 (Prioridad MEDIA)

# IMPORTANTE

- Deben aparecer primero las palabras claves de la pregunta del usuario haciendo énfasis sobre en qué paso está, luego las palabras clave del ADD 3.0 y por último las del negocio, no puede haber más palabras clave de una sección que de otra, debes hacerlo lo más condensado posible ;incluso modera la cantidad de espacios, tú salida no puede contener información inutil como "aquí tienes el contenido", únicamente las palabras clave.

"""

    system_prompt_formatted = f"""<|begin_of_text|><|start_header_id|>system<|end_header_id|>\n{system_prompt}<|eot_id|>"""
    user_prompt_formatted = (
        f"""<|start_header_id|>user<|end_header_id|>\n{user_prompt}<|eot_id|>"""
    )
    waitForAssistantPrompt = f"""<|start_header_id|>assistant<|end_header_id|>"""

    final_prompt = (
        system_prompt_formatted + user_prompt_formatted + waitForAssistantPrompt
    )

    model_invoke_params = {"prompt": final_prompt, **model_params}


    response = bedrock.invoke_model(
        body=json.dumps(model_invoke_params),
        modelId=modelId,
    )

    raw_body = response["body"].read().decode("utf-8")
    response_json = json.loads(raw_body)
    try:
        respuesta = [*response_json.values()][0]
        return respuesta
    except Exception as e:
        respuesta = False
    finally:
        return respuesta

def insertContextPhase(phase, response_knowledge_base, variables=None, iteration=None):
    # Obtener información de las variables
    ADD1 = get_info_by_name(variables, "ADD 3.0 deliverable Step 1: Review inputs")
    objetivo_propuesto = iteration["objetive"]
    número_de_iteración = iteration["number"]
    elementos_del_sistema = iteration["systemElements"]

    # Construir el contexto del ADD 3.0 a partir de la base de conocimiento
    contexto_add = ""
    contador = 1

    for i in response_knowledge_base:
        contexto_add += f"--- Fragmento de contexto {contador} ---\n"
        contexto_add += f"{i['content']['text']}\n"
        contexto_add += f"Relevancia: {i['score']}\n"
        contexto_add += f"Fuente {contador}: {i['location']['s3Location']['uri']}\n"
        contexto_add += "-" * 50 + "\n"  
        contador += 1

    elementos_del_sistema_ordenados = sorted(
        elementos_del_sistema, key=lambda x: x["name"]
    )
    descripcion_elementos = "\n\n     ".join(
        [
            f"System Element: {element['name']}: {element['description']}"
            for element in elementos_del_sistema_ordenados
        ]
    )

    # Verificar si estamos en el paso 3 del ADD 3.0
    final = phase["description"].format(
            add_context=contexto_add,
            add_1=ADD1,
            objetivo_propuesto=objetivo_propuesto,
            número_de_iteración=número_de_iteración,
            elementos_del_sistema=descripcion_elementos,
        )
    return final


def extractContextBusiness(variables):
    ADD_context = ""
    for variable in variables:
        ADD_context += f"{variable['name']}: {variable['value']}\n"

    return ADD_context

def insertContext(question, response_knowledge_base, variables, useBusinessContext):
    context = ""
    contador = 1
    for i in response_knowledge_base:
        context += f"--- Fragmento de contexto {contador} ---\n"
        context += f"{i['content']['text']}\n"
        context += f"Relevancia: {i['score']}\n"
        context += f"Fuente {contador}: {i['location']['s3Location']['uri']}\n"
        context += "-" * 50 + "\n"
        contador += 1

    ADD_context = ""
    if useBusinessContext:
        for variable in variables:
            if variable["name"] == "ADD 3.0 deliverable Step 1: Review inputs":
                ADD_context += f"{variable['name']}: {variable['value']}\n"
                break

    # Formatear la pregunta con el contexto
    question_with_context = f"""
## User:

 --------------------------------

 USER: {question} END:USER

### Context (no usar si no se relaciona con la petición de arriba):

 --------------------------------

#### ADD 3.0 Business Context:

 --------------------------------

{ADD_context}

 --------------------------------

#### ADD 3.0 Technical Context:

 --------------------------------

{context}

 --------------------------------
### Fin del contexto
"""
    return question_with_context




def define_Llama3_prompt(history, system_prompt, question_with_context_variables):

    SystemPrompt = f"""<|begin_of_text|><|start_header_id|>system<|end_header_id|>\n{system_prompt}<|eot_id|>"""
    waitForAssistantPrompt = f"""<|start_header_id|>assistant<|end_header_id|>"""
    init = SystemPrompt
    for i in range(len(history)):
        if i % 2 == 0:
            init += (
                f"""<|start_header_id|>user<|end_header_id|>\n{history[i]}<|eot_id|>"""
            )
        else:
            init += f"""<|start_header_id|>assistant<|end_header_id|>\n{history[i]}<|eot_id|>"""

    init += f"""<|start_header_id|>user<|end_header_id|>\n{question_with_context_variables}<|eot_id|>"""
    init += waitForAssistantPrompt
    return init


supported_models = {
    "meta.llama3-8b-instruct-v1:0": define_Llama3_prompt,
    "meta.llama3-70b-instruct-v1:0": define_Llama3_prompt,
}


model_specific_params = {
    "meta.llama3-8b-instruct-v1:0": {"temperature": 0, "top_p": 0, "max_gen_len": 2048},
    "meta.llama3-70b-instruct-v1:0": {
        "temperature": 0.7,
        "top_p": 0.9,
        "max_gen_len": 2048,
    },
}


def get_info_by_name(variables, name):
    for variable in variables:
        if variable["name"] == name:
            return variable["value"]
    return None


def bedrockQuestion(
    history,
    question,
    modelId,
    model_params=None,
    system_prompt=None,
    knowledgeBaseId=None,
    use_knowledge_base=True,
    number_of_results=1,
    variables=None,
    AgentPhase=None,
    iteration=None,
    executePhase=None,
    useBusinessContext=None,
):
    if model_params is None:
        model_params = {}
    if modelId in supported_models:
        historial = extract_messages_from_chat(history)
        if use_knowledge_base:
            if executePhase:
                print("Ejecutando fase")

                best_question = bestKnowledgeBaseQuestion(
                    variables, question, modelId, knowledgeBaseId, number_of_results
                )

                if best_question:
                    questionKnowledge = best_question
                else:
                    questionKnowledge = AgentPhase["instruccion"]

                print("Pregunta de la base de conocimiento: ", questionKnowledge)

                response_knowledge_base_query = retrieveFromKnowledgeBase(
                    questionKnowledge, knowledgeBaseId, number_of_results
                )["retrievalResults"]

                print("Respuesta de la base de conocimiento: ", response_knowledge_base_query)

                

                question_with_context = insertContextPhase(
                    AgentPhase, response_knowledge_base_query, variables, iteration
                )

                print("Pregunta con contexto: ", question_with_context)
            else:
                
                response_knowledge_base_query = retrieveFromKnowledgeBase(
                    AgentPhase["instruccion"], knowledgeBaseId, number_of_results
                )["retrievalResults"]

                question_with_context = insertContext(
                    question,
                    response_knowledge_base_query,
                    variables,
                    useBusinessContext
                )
        else:
            question_with_context = question

        prompt = supported_models[modelId](
            historial, system_prompt, question_with_context
        )

        params = {**model_specific_params.get(modelId, {}), **model_params}
        model_invoke_params = {"prompt": prompt, **params}

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
        variables = event["userInput"]["variables"]
        iteration = event["userInput"].get("Iteration")
        useBusinessContext = event["userInput"].get("useBusinessContext")

        variables_list = [
            {"name": var["name"], "value": var["value"]} for var in variables
        ]

        phase = event["userInput"]["agentPhase"]
        executePhase = event["userInput"].get("executePhase")


        response = bedrockQuestion(
            event["chatString"],
            event["userInput"]["message"],
            event["userInput"]["model"]["model"],
            model_params=model_params,
            system_prompt=system_prompt,
            knowledgeBaseId=knowledge_base_params["knowledgeBaseId"],
            use_knowledge_base=knowledge_base_params["useKnowledgeBase"],
            number_of_results=knowledge_base_params["numberOfResults"],
            variables=variables_list,
            AgentPhase=phase,
            iteration=iteration,
            executePhase=executePhase,
            useBusinessContext=useBusinessContext,
        )

        chatResponder.publish_agent_message(response)
    except Exception as e:
        chatResponder.publish_agent_message(str(e))

    chatResponder.publish_agent_stop_responding()
