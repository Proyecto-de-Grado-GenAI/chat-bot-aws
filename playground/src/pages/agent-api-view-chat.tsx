import { useParams } from "react-router-dom";
import { useRecoilState, useRecoilValue } from "recoil";
import { useState, useEffect } from "react";
import {
  TextAreaField,
  View,
  Flex,
  Card,
  Loader,
  Text,
} from "@aws-amplify/ui-react";
import {
  useAgentApiAgent,
  useAgentApiConversationWithMessages,
  useAgentApiSendMessage,
  useAgentApiSubscribeConversation,
} from "../apis/agent-api";
import { Container } from "../library/container";
import { ChatRendered } from "../library/chat/chat-rendered";
import { useAgentApiConversation } from "../apis/agent-api/hooks/useConversations";
import {
  useAgentConversationMetadata,
  useResetAgentConversationMetadata,
} from "../apis/agent-api/hooks/useMetadata";
import { selectedLlmState, selectedAgentState, variablesState } from "../apis/agent-api/state";
import llama3Tokenizer from "llama3-tokenizer-js";

export function AIAgentViewChat() {
  const { chatId } = useParams();
  const selectedLlm = useRecoilValue(selectedLlmState);
  const conversationObject = useAgentApiConversation(chatId);
  const agentObject = useAgentApiAgent(conversationObject.value?.agent);
  const { loadingConversation, events, conversation } =
    useAgentApiConversationWithMessages(chatId);
  const [chatString, setChatString] = useState("");
  const [tokens, setTokens] = useState(0);
  const conversationMetadata = useAgentConversationMetadata();
  const resetMetadata = useResetAgentConversationMetadata();
  const submitMessage = useAgentApiSendMessage(chatId);
  const selectedAgent = useRecoilValue(selectedAgentState);
  const [variablesList] = useRecoilState(variablesState);

  useAgentApiSubscribeConversation(chatId);

  useEffect(() => {
    if (
      conversationMetadata.partialMessage &&
      !conversationMetadata.responding
    ) {
      resetMetadata();
    }
  }, [chatId, resetMetadata, conversationMetadata]);

  useEffect(() => {
    let totalTokens = 0;
    if (events) {
      totalTokens = events.reduce(
        (acc, event) =>
          acc +
          llama3Tokenizer.encode(event.event.message!, {
            bos: false,
            eos: false,
          }).length,
        0
      );
    }
    const currentInputTokens = llama3Tokenizer.encode(chatString, {
      bos: false,
      eos: false,
    }).length;
    setTokens(totalTokens + currentInputTokens);
  }, [events, chatString]);

  const handleSendMessage = () => {
    if (!selectedLlm) {
      alert("Por favor, seleccione un LLM para enviar mensajes.");
      return;
    }
    console.log(variablesList);
    const payload = {
      message: chatString,
      model: selectedLlm,
      modelParams: {
        temperature: agentObject.value?.modelParams.temperature || 0.7,
        top_p: agentObject.value?.modelParams.top_p || 0.9,
        max_gen_len: agentObject.value?.modelParams.max_gen_len || 2500,
      },
      systemPrompt: agentObject.value?.systemPrompt || "",
      knowledgeBaseParams: {
        knowledgeBaseId: agentObject.value?.knowledgeBaseParams.knowledgeBaseId || "",
        useKnowledgeBase: agentObject.value?.knowledgeBaseParams.useKnowledgeBase || false,
        numberOfResults: agentObject.value?.knowledgeBaseParams.numberOfResults || 3,
      },
      variables: variablesList,
    };
    console.log("Sending message:", payload);
    submitMessage(payload);
    setChatString("");
  };

  const maxCharacters = agentObject.value?.inputMaxToken || 1000; // Asegúrate de tener un valor predeterminado

  if (
    conversationObject.isUnloaded() ||
    !conversationObject.value ||
    agentObject.isUnloaded() ||
    !agentObject.value ||
    loadingConversation
  ) {
    return <Loader />;
  }

  return (
    <>
      <View>
        <Container
          heading={`Etapa: '${agentObject.value.name}'`}
          minHeight={500}
          padBody={0}
        >
          <ChatRendered />
        </Container>
        <Card>
          {conversationMetadata.responding && <Loader variation="linear" />}
          {!conversationMetadata.responding && (
            <>
              <TextAreaField
                labelHidden
                label="Message"
                placeholder="Escribe tu mensaje aquí..."
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    handleSendMessage();
                    e.preventDefault();
                  }
                }}
                value={chatString}
                onChange={(e) => setChatString(e.target.value)}
                maxLength={maxCharacters}
              />
              <Flex justifyContent="space-between">
                <Text>{`Presiona Enter para enviar el mensaje`}</Text>
                <Text>{`${tokens} tokens`}</Text>
                <Text>{`${chatString.length} / ${maxCharacters} caracteres`}</Text>
              </Flex>
            </>
          )}
        </Card>
      </View>
    </>
  );
}
