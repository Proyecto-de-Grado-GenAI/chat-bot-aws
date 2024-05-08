import { AgentApiConversationListed } from "../library/chat/conversation-listed";
import { Outlet, useNavigate, useParams } from "react-router-dom";
import {
  useAgentApiAgentList,
  useAgentApiConversationList,
  useLLmList,
} from "../apis/agent-api";
import { Button, Flex, Loader, View } from "@aws-amplify/ui-react";
import { Container } from "../library/container";
import { Combobox } from "react-widgets/cjs";
import "react-widgets/scss/styles.scss";
import { useRecoilState } from "recoil";
import { activeConversationsState, selectedLlmState } from "../apis/agent-api/state";
import { useEffect, useState} from "react";

import { selectedAgentState } from "../apis/agent-api/state";

export function AIAgentSidebar() {
  const { chatId } = useParams();
  const conversationsObject = useAgentApiConversationList();
  const agentObjectList = useAgentApiAgentList();

  const LLmsObject = useLLmList();
  const [selectedLlm, setSelectedLlm] = useRecoilState(selectedLlmState);
  const [selectedAgent, setSelectedAgent] = useRecoilState(selectedAgentState);
  const [lastSelectedAgentId, setLastSelectedAgentId] = useState<string | null>(null);
  const [agentConversations, setAgentConversations] = useRecoilState(activeConversationsState);

  useEffect(() => {
    const initialAgent = agentObjectList.value?.items().find(agent => agent.precedence === 1) || null;
    setSelectedAgent(initialAgent);
  }, [agentObjectList.value, setSelectedAgent]);

  const nav = useNavigate();
  


  useEffect(() => {
    if (selectedAgent && selectedAgent.id !== lastSelectedAgentId) {
      setLastSelectedAgentId(selectedAgent.id);

      const activeChatId = agentConversations[selectedAgent.id];
      if (activeChatId) {
        // Si existe una conversación activa y es diferente de la actual, navegar a ella
        if (chatId !== activeChatId) {
          nav(`/chat/view/${activeChatId}`);
        }
      } else {
        // Si no hay una conversación activa, navegar a la página de inicio de conversación
        nav('/chat');
      }
    }
  }, [selectedAgent, agentConversations, chatId, nav, lastSelectedAgentId]);

  if (
    conversationsObject.isUnloaded() ||
    !conversationsObject.value ||
    agentObjectList.isUnloaded() ||
    !agentObjectList.value ||
    LLmsObject.isUnloaded() ||
    !LLmsObject.value
  ) {
    return <Loader />;
  }

  const conversationsRendered = selectedAgent
    ? conversationsObject.value
        .items()
        .filter((conversation) => conversation.agent === selectedAgent.id)
        .sort((c1, c2) => (c1.timestamp < c2.timestamp ? 1 : -1))
        .map((conversation) => (
          <AgentApiConversationListed
            agent={agentObjectList.value
              ?.items()
              .find((agent) => agent.id === conversation.agent)}
            conversation={conversation}
            key={conversation.id}
          />
        ))
    : [];

  const heading =
    `LLM: ${selectedLlm?.name || "No LLM selected"}` +
    `       ` +
    ` - Agente: ${selectedAgent?.name || "No agent selected"}`;

  return (
    <Flex>
      <Container heading="Conversaciones y LLms" width="20%">
        <Container heading="Tu LLM">
          <Combobox
            data={LLmsObject.value?.items()}
            textField="name"
            onSelect={(value) => {
              if (typeof value === "object" && value !== null) {
                setSelectedLlm(value);
              }
            }}
            value={selectedLlm}
          />
        </Container>
        <Container heading="Tus conversaciones">
          <Flex
            direction="column"
            gap={10}
            maxHeight={"calc(100vh - 150px)"}
            overflow="auto"
          >
            {conversationsRendered}
          </Flex>
          <br />
          <Button isFullWidth onClick={() => nav("/chat/new")}>
            Nueva conversacion
          </Button>
        </Container>
      </Container>
      <Container heading={heading} width="100%">
        <Outlet />
      </Container>

      <Container heading="Etapas y contexto" width="40%">
        <Container heading="Etapas">
          <Flex direction="row" gap={5}>
            {agentObjectList.value
              ?.items()
              .slice() // Crea una copia del array para no modificar el original
              .sort((a, b) => a.precedence - b.precedence) // Ordena por la propiedad 'precedence'
              .map((agent, index) => (
                <Button key={agent.id} onClick={() => setSelectedAgent(agent)}>
                  {agent.name}
                </Button>
              ))}
          </Flex>
        </Container>

        <Container heading="Variables">
          <Flex direction="row" gap={10}></Flex>
        </Container>
        <Container heading="Preview">
          <Flex direction="row" gap={10}></Flex>
        </Container>
      </Container>
    </Flex>
  );
}
