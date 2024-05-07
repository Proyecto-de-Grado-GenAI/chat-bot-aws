import boto3, json
from chatResponder import ChatResponder
from botocore.config import Config

bedrock = boto3.client("bedrock-runtime", config=Config(region_name="us-east-1"))

bedrock_agent_runtime = boto3.client(
    service_name="bedrock-agent-runtime",
    region_name="us-east-1",
)


def retrieve(query, kbId, numberOfResults=1):
    return bedrock_agent_runtime.retrieve(
        retrievalQuery={"text": query},
        knowledgeBaseId=kbId,
        retrievalConfiguration={
            "vectorSearchConfiguration": {"numberOfResults": numberOfResults}
        },
    )


def bedrockS(prompt, question, modelId="anthropic.claude-v2"):
    response_knowledge_base = retrieve(question, "FFUYGR42Y1")["retrievalResults"]
    context = ""
    contador = 0
    for i in response_knowledge_base:
        context += "Context " + str(contador) + "\n"
        context += i["content"]["text"] + "\n"
        context += f"Source:{str(contador)} " + i["location"]["s3Location"]["uri"] + "\n"
        contador += 1

    question = f"""{question}\n\n{context}"""

    print(prompt)

    system_prompt = """Eres un agente de inteligencia artificial muy especializado en la arquitectura de software,
    das respuestas en el mismo lenguaje que te preguntan y además tienes acceso a una base de conocimiento 
    con información relevante para responder preguntas relacionadas al ADD 3.0 y que se manifiesta como Context bajo la pregunta que se te realiza,
    además siempre proporcionas en la parte final de tus respuestas la fuente de la información exacta que utilizaste para responder la pregunta.
    En caso de que la información que te proporciono no sea suficiente para responder la pregunta, por favor házmelo saber para poder proporcionarte más información o contexto.
    Recuerda que siempre debes responder en el mismo lenguaje que te preguntan y que debes explicar de una forma detallada y entendible para un arquitecto de software.
    """
    prompt = f"""<|begin_of_text|><|start_header_id|>system<|end_header_id|>\n{ system_prompt }\n<|eot_id|><|start_header_id|>user<|end_header_id|>\n{ question }\n<|eot_id|><|start_header_id|>assistant<|end_header_id|>"""

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


def handler(event, context):

    chatResponder = ChatResponder(event["conversationData"]["id"])
    try:
        response = bedrockS(
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
