import { useParams } from "react-router-dom";
import { useRecoilValue } from "recoil";
import { useState, useEffect } from "react";
import { TextAreaField, View, Flex, Card, Loader, Text } from "@aws-amplify/ui-react";

import { useAgentApiAgent, useAgentApiSendMessage, useAgentApiSubscribeConversation } from "../apis/agent-api";
import { Container } from "../library/container";
import { ChatRendered } from "../library/chat/chat-rendered";
import { AIAgentChatConnections } from "./agent-api-chat-connections";
import { useAgentApiConversation } from "../apis/agent-api/hooks/useConversations";
import { useAgentConversationMetadata, useResetAgentConversationMetadata } from "../apis/agent-api/hooks/useMetadata";
import { selectedLlmState } from "../apis/agent-api/state";

export function AIAgentViewChat () {
    const { chatId } = useParams();
    const selectedLlm = useRecoilValue(selectedLlmState);

    const conversationObject = useAgentApiConversation(chatId);
    const agentObject = useAgentApiAgent(conversationObject.value?.agent);

    const [chatString, setChatString] = useState("");
    const conversationMetadata = useAgentConversationMetadata();
    const resetMetadata = useResetAgentConversationMetadata();
    const submitMessage = useAgentApiSendMessage(chatId);

    useAgentApiSubscribeConversation(chatId);

    useEffect(() => {
        if (conversationMetadata.partialMessage && !conversationMetadata.responding) {
            resetMetadata();
        }
    }, [chatId, resetMetadata, conversationMetadata]);

    const handleSendMessage = () => {
        if (!selectedLlm) {
            alert("Por favor, seleccione un LLM para enviar mensajes.");
            return;
        }
        submitMessage({ message: chatString, model: selectedLlm });
        setChatString('');
    };

    const maxCharacters = agentObject.value?.inputMaxToken || 1000;  // Asegúrate de tener un valor predeterminado

    if (conversationObject.isUnloaded() || !conversationObject.value || agentObject.isUnloaded() || !agentObject.value) {
        return <Loader />;
    }

    return (
        <Flex>
            <View width={900}>
                <h3 style={{textAlign: 'center'}}>LLM: {selectedLlm?.name} y Agente Etapa: {agentObject.value.name}</h3>
                <Container heading={`Etapa: '${agentObject.value.name}'`} minHeight={500} padBody={0}>
                    <ChatRendered/>
                </Container>
                <Card>
                    {
                        conversationMetadata.responding && <Loader variation="linear"/>
                    }
                    {
                        !conversationMetadata.responding && (
                            <>
                                <TextAreaField 
                                    labelHidden
                                    label="Message"
                                    placeholder="Type your message here"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            handleSendMessage();
                                            e.preventDefault();
                                        }
                                    }}
                                    value={chatString}
                                    onChange={(e) => setChatString(e.target.value)}
                                    maxLength={maxCharacters}
                                />
                                <Text>{`${chatString.length} / ${maxCharacters} caracteres`}</Text>
                            </>
                        )
                    }
                </Card>
            </View>
            <View width={300}>
                <AIAgentChatConnections/>
            </View>
        </Flex>
    );
}
