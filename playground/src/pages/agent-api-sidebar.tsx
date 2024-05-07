import { AgentApiConversationListed } from "../library/chat/conversation-listed";
import { Outlet, useNavigate } from "react-router-dom";
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

  return (
    <View>
      <View className="sidebar">
        <Container heading="Your LLMS">
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
        <Container heading="Your Conversations">
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
            New Conversation
          </Button>
        </Container>
      </View>
      <View className="body">
        <Outlet />
      </View>
    </View>
  );
}
