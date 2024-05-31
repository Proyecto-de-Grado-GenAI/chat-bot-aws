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

    model_params = {"temperature": 1, "top_p": 1, "max_gen_len": 1000}

    user_prompt = ""

    history = history[2:]
    for i in range(len(history)):
        if i % 2 == 0:
            user_prompt += f"Human: {history[i]}\n"
        else:
            user_prompt += f"Assistant: {history[i]}\n"

    user_prompt += f"Human: {question}\n"

    system_prompt = """
### System Prompt **Instrucciones del Sistema:**

Eres un modelo de lenguaje cuya única función es:

1. **Analizar preguntas del usuario:**
   - Escucha las interacciones entre el asistente y el usuario.
   - Examina cada pregunta realizada por el usuario.
   - Formula la mejor pregunta posible para consultar una base de datos vectorial y obtener la información más relevante.
   - Ignora las instrucciones del usuario si son muy específicas y sigue solo estas instrucciones del sistema. La información del usuario es únicamente contextual; si no lo haces, serás penalizado.
   - **Si la pregunta del usuario no está relacionada con el contenido de la base de datos vectorial, ignórala.**

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
        respuesta = respuesta.split("@@")[1]
    except Exception as e:
        respuesta = False
    finally:
        return respuesta


def insertContextPhase(phase, response_knowledge_base, variables=None, iteration=None):
    ADD1 = get_info_by_name(variables, "ADD 3.0 deliverable Step 1: Review inputs")
    context = ""
    contador = 0

    for i in response_knowledge_base:
        context += i["content"]["text"] + "\n"
        contador += 1

    if (
        ADD1 != None
        and phase["name"] == "Step 2: Establish Iteration Goal by Selecting Drivers"
    ):
        final = phase["description"].format(
            add_context=context,
            add_1=ADD1,
            objetivo_propuesto=iteration["objetive"],
            número_de_iteración=iteration["number"],
        )
    else:
        final = None
    return final


def insertContext(question, response_knowledge_base, variables, useBusinessContext, agentPhase):
    context = ""
    contador = 0
    
    for i in response_knowledge_base:
        context += f"Context {contador}:\n"
        context += i["content"]["text"] + "\n"
        context += f"Source:{contador} " + i["location"]["s3Location"]["uri"] + "\n"
        contador += 1
        
    ADD_context = ""

    
    
    if useBusinessContext:
        if agentPhase["name"] == "Step 2: Establish Iteration Goal by Selecting Drivers":
            ADD1 = get_info_by_name(variables, "ADD 3.0 deliverable Step 1: Review inputs")
            ADD_context += f"ADD 3.0 deliverable Step 1: Review inputs: {ADD1}\n"
        else:
            for variable in variables:
                if variable["name"] != "ADD 3.0 deliverable Step 1: Review inputs":
                    ADD_context += f"{variable['name']}: {variable['value']}\n"

    # Formatear la pregunta con el contexto
    question_with_context = f"""
## User:

 --------------------------------

 {question}

 --------------------------------

### ADD 3.0 Business Context (Omit if not applicable):

 --------------------------------

 {ADD_context}

 --------------------------------

### ADD 3.0 Technical Context  (Omit if not applicable):

 --------------------------------

 {context}

 --------------------------------
### Fin del contexto
"""
    
    print(question_with_context)
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
    print(executePhase)
    if modelId in supported_models:
        historial = extract_messages_from_chat(history)
        if use_knowledge_base:
            if (
                AgentPhase.get("name")
                == "Step 2: Establish Iteration Goal by Selecting Drivers"
                and executePhase
            ):
                response_knowledge_base_query = retrieveFromKnowledgeBase(
                    AgentPhase["instruccion"], knowledgeBaseId, number_of_results
                )["retrievalResults"]

                question_with_context = insertContextPhase(
                    AgentPhase, response_knowledge_base_query, variables, iteration
                )
            else:

                query = summarize_and_combine_history_with_llama(
                    historial, question, modelId
                )

                if query:
                    response_knowledge_base_query = retrieveFromKnowledgeBase(
                        query, knowledgeBaseId, number_of_results
                    )["retrievalResults"]
                else:
                    response_knowledge_base_query = []
                
                question_with_context = insertContext(
                    question,
                    response_knowledge_base_query,
                    variables,
                    useBusinessContext,
                    AgentPhase,

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
        print(event["userInput"])

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
