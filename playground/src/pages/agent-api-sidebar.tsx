import { AgentApiConversationListed } from "../library/chat/conversation-listed";
import { Outlet, useNavigate } from "react-router-dom";
import {
  useAgentApiAgentList,
  useAgentApiConversationList,
  useLLmList,
} from "../apis/agent-api";
import { Button, Flex, Loader, View } from "@aws-amplify/ui-react";
import { Container } from '../library/container';
import { Combobox } from "react-widgets/cjs";
import "react-widgets/scss/styles.scss";
import { useRecoilState } from "recoil";
import { selectedLlmState } from "../apis/agent-api/state";

export function AIAgentSidebar() {
  const conversationsObject = useAgentApiConversationList();
  const agentObjectList = useAgentApiAgentList();
  const LLmsObject = useLLmList();
  const [selectedLlm, setSelectedLlm] = useRecoilState(selectedLlmState);

  const nav = useNavigate();

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

  const conversationsRendered = conversationsObject.value
    .items()
    .sort((c1, c2) => (c1.timestamp < c2.timestamp ? 1 : -1))
    .map((conversation) => (
      <AgentApiConversationListed
        agent={agentObjectList.value
          ?.items()
          .find((agent) => agent.id === conversation.agent)}
        conversation={conversation}
        key={conversation.id}
      />
    ));

    const heading = `LLM: ${selectedLlm?.name}`;

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

        <Container heading= {heading} width="70%">
          <Outlet />
        </Container>
    
        <Container heading="Etapas y contexto" width="30%">
          <Container heading="Etapas">
            <Flex direction="row" gap={10}>
              <Button onClick={() => nav("/chat/view/1")}>Etapa 1</Button>
              <Button onClick={() => nav("/chat/view/2")}>Etapa 2</Button>
              <Button onClick={() => nav("/chat/view/3")}>Etapa 3</Button>
              <Button onClick={() => nav("/chat/view/3")}>Etapa 4</Button>
              <Button onClick={() => nav("/chat/view/3")}>Etapa 5</Button>
            </Flex>
          </Container>
          <Container heading="Variables">
            <Flex direction="row" gap={10}>
              <Button onClick={() => nav("/chat/view/1")}>Etapa 1</Button>
              <Button onClick={() => nav("/chat/view/2")}>Etapa 2</Button>
              <Button onClick={() => nav("/chat/view/3")}>Etapa 3</Button>
              <Button onClick={() => nav("/chat/view/3")}>Etapa 4</Button>
              <Button onClick={() => nav("/chat/view/3")}>Etapa 5</Button>
            </Flex>
          </Container>
          <Container heading="Preview">
            <Flex direction="row" gap={10}>
              <Button onClick={() => nav("/chat/view/1")}>Etapa 1</Button>
              <Button onClick={() => nav("/chat/view/2")}>Etapa 2</Button>
              <Button onClick={() => nav("/chat/view/3")}>Etapa 3</Button>
              <Button onClick={() => nav("/chat/view/3")}>Etapa 4</Button>
              <Button onClick={() => nav("/chat/view/3")}>Etapa 5</Button>
            </Flex>
          </Container>
        </Container>
      </Flex>
    );
    
}
