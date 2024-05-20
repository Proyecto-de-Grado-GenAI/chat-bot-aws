import { AgentApiConversationListed } from "../library/chat/conversation-listed";
import { Outlet, useNavigate, useParams } from "react-router-dom";
import {
  useAgentApiAgentList,
  useAgentApiConversationList,
  useKnowledgeBase,
  useLLmList,
} from "../apis/agent-api";
import {
  Button,
  Flex,
  Loader,
  SliderField,
  SelectField,
  TextField,
  TextAreaField,
  CheckboxField,
} from "@aws-amplify/ui-react";
import { Container } from "../library/container";
import "react-widgets/scss/styles.scss";
import { useRecoilState } from "recoil";
import {
  activeConversationsState,
  selectedLlmState,
  selectedAgentState,
  variablesState,
} from "../apis/agent-api/state";
import { useEffect, useState } from "react";
import { useAgentApiUpdateAgent } from "../apis/agent-api/hooks/useUpdateAgent";
import remarkGfm from "remark-gfm";
import ReactMarkdown from "react-markdown";
import CustomStorageManager from "../components/CustomStorageManager"

export function AIAgentSidebar() {
  const { chatId } = useParams();

  const conversationsObject = useAgentApiConversationList();
  const agentObjectList = useAgentApiAgentList();
  const LLmsObject = useLLmList();
  const updateAgent = useAgentApiUpdateAgent();

  const [selectedLlm, setSelectedLlm] = useRecoilState(selectedLlmState);
  const [selectedAgent, setSelectedAgent] = useRecoilState(selectedAgentState);
  const [lastSelectedAgentId, setLastSelectedAgentId] = useState<string | null>(
    null
  );
  const [agentConversations, setAgentConversations] = useRecoilState(
    activeConversationsState
  );

  const [temperature, setTemperature] = useState<number | null>(null);
  const [topP, setTopP] = useState<number | null>(null);
  const [maxGenLen, setMaxGenLen] = useState(1500);
  const [systemPrompt, setSystemPrompt] = useState(
    "Eres un asistente útil y amigable."
  );
  const [knowledgeBaseId, setKnowledgeBaseId] = useState("FFUYGR42Y1");
  const [IfUseKnowledgeBase, setUseKnowledgeBase] = useState(true);
  const [numberOfResults, setNumberOfResults] = useState(3);
  const [agentName, setAgentName] = useState("");
  const [handlerLambda, setHandlerLambda] = useState("");
  const [inputMaxToken, setInputMaxToken] = useState(1000);
  const [precedence, setPrecedence] = useState(1);
  const [forceRender, setForceRender] = useState(false);
  const [selectedVariable, setSelectedVariable] = useState(
    "Telecommunications Company"
  );
  const [variablesList] = useRecoilState(variablesState);

  const selectedContent =
    variablesList.find((variable) => variable.name === selectedVariable)
      ?.value || "";

  const handleVariableChange = (event: any) => {
    setSelectedVariable(event.target.value);
  };

  const KnowledgeBases = useKnowledgeBase();

  const nav = useNavigate();

  const onUpdate = () => {
    const updatedAgent = {
      name: agentName,
      handlerLambda: handlerLambda,
      systemPrompt: systemPrompt,
      inputMaxToken: inputMaxToken,
      precedence: precedence,
      modelParams: {
        temperature: temperature!,
        top_p: topP!,
        max_gen_len: maxGenLen,
      },
      knowledgeBaseParams: {
        knowledgeBaseId: knowledgeBaseId,
        useKnowledgeBase: IfUseKnowledgeBase,
        numberOfResults: numberOfResults,
      },
    };
    updateAgent(selectedAgent!.id, updatedAgent)
      .then(() => {
        alert("Agent updated successfully!");
      })
      .catch((error) => {
        alert(`Failed to update agent: ${error.message}`);
      });
  };

  useEffect(() => {
    if (selectedAgent !== null) {
      const agent = selectedAgent;
      console.log("Agent Object:", agent); // Print the agent object
      console.log(agent.modelParams?.temperature); // Print the agent temperature
      setAgentName(agent.name || "");
      setHandlerLambda(agent.handlerLambda || "");
      setSystemPrompt(
        agent.systemPrompt || "Eres un asistente útil y amigable."
      );
      setInputMaxToken(agent.inputMaxToken || 1000);
      setPrecedence(agent.precedence || 1);
      setTemperature(agent.modelParams?.temperature ?? 0.7);
      setTopP(agent.modelParams?.top_p ?? 0.9);
      setMaxGenLen(agent.modelParams?.max_gen_len || 1500);
      setKnowledgeBaseId(
        agent.knowledgeBaseParams?.knowledgeBaseId || "FFUYGR42Y1"
      );
      setUseKnowledgeBase(agent.knowledgeBaseParams?.useKnowledgeBase ?? true);
      setNumberOfResults(agent.knowledgeBaseParams?.numberOfResults || 3);
      setForceRender((prev) => !prev);
    }
  }, [selectedAgent]);

  useEffect(() => {
    if (agentObjectList.value) {
      const initialAgent =
        agentObjectList.value.items().find((agent) => agent.precedence === 1) ||
        null;
      setSelectedAgent(initialAgent);
    }
  }, [agentObjectList.value, setSelectedAgent]);

  useEffect(() => {
    if (selectedAgent && selectedAgent.id !== lastSelectedAgentId) {
      setLastSelectedAgentId(selectedAgent.id);

      const activeChatId = agentConversations[selectedAgent.id];
      if (activeChatId) {
        if (chatId !== activeChatId) {
          nav(`/chat/view/${activeChatId}`);
        }
      } else {
        nav("/chat");
      }
    }
  }, [selectedAgent, agentConversations, chatId, nav, lastSelectedAgentId]);

  useEffect(() => {
    if (chatId && conversationsObject.value && agentObjectList.value) {
      const conversation = conversationsObject.value
        .items()
        .find((conv) => conv.id === chatId);
      if (conversation) {
        const agent =
          agentObjectList.value
            .items()
            .find((agent) => agent.id === conversation.agent) || null;
        setSelectedAgent(agent);
      }
    }
  }, [
    chatId,
    conversationsObject.value,
    agentObjectList.value,
    setSelectedAgent,
  ]);

  if (
    conversationsObject.isUnloaded() ||
    !conversationsObject.value ||
    agentObjectList.isUnloaded() ||
    !agentObjectList.value ||
    LLmsObject.isUnloaded() ||
    !LLmsObject.value ||
    KnowledgeBases.isUnloaded() ||
    !KnowledgeBases.value
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
          <SelectField
            label="Selecciona un LLM"
            size="small"
            value={selectedLlm ? selectedLlm.id : ""}
            onChange={(e) => {
              const selected = LLmsObject.value!.items().find(
                (llm) => llm.id === e.target.value
              );
              setSelectedLlm(selected!);
            }}
          >
            {LLmsObject.value.items().map((llm) => (
              <option key={llm.id} value={llm.id}>
                {llm.name}
              </option>
            ))}
          </SelectField>
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

      <Container heading="Etapas y contexto" width="60%">
        <Container heading="Etapas">
          <Flex direction="row" gap={5}>
            {agentObjectList.value
              ?.items()
              .slice()
              .sort((a, b) => a.precedence - b.precedence)
              .map((agent, index) => (
                <Button
                  key={agent.id}
                  onClick={() => setSelectedAgent(agent)}
                >
                  {agent.name}
                </Button>
              ))}
          </Flex>
        </Container>

        {selectedAgent?.name === "Comprensión" && (
          <Container heading="Sube tus documentos">
            <CustomStorageManager />
          </Container>
        )}

        <Container heading="Parámetros del Modelo">
          <Flex direction="column" gap={10}>
            {temperature !== null && (
              <SliderField
                key={`temperature-${forceRender}`} // Force render by changing key
                label="Temperature"
                min={0}
                max={1}
                step={0.01}
                value={temperature}
                onChange={(value) => setTemperature(value)}
              />
            )}
            {topP !== null && (
              <SliderField
                key={`topP-${forceRender}`} // Force render by changing key
                label="Top P"
                min={0}
                max={1}
                step={0.01}
                value={topP}
                onChange={(value) => setTopP(value)}
              />
            )}
            <TextField
              label="Max Gen Len"
              placeholder="1500"
              size="small"
              value={maxGenLen}
              onChange={(e) =>
                setMaxGenLen(
                  e.target.value ? parseInt(e.target.value, 10) : 0
                )
              }
            />
            <TextAreaField
              label="System Prompt"
              placeholder="Eres un asistente útil y amigable."
              size="small"
              rows={5}
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
            />
            <SelectField
              label="Knowledge Base"
              size="small"
              value={knowledgeBaseId}
              onChange={(e) => setKnowledgeBaseId(e.target.value)}
            >
              {KnowledgeBases.value?.map((kb) => (
                <option key={kb.knowledgeBaseId} value={kb.knowledgeBaseId}>
                  {kb.name}
                </option>
              ))}
            </SelectField>
            <CheckboxField
              label="Use Knowledge Base"
              name="useKnowledgeBase"
              checked={IfUseKnowledgeBase}
              onChange={(e) => setUseKnowledgeBase(e.target.checked)}
            />
            <TextField
              label="Number of Results"
              placeholder="3"
              size="small"
              value={numberOfResults}
              onChange={(e) =>
                setNumberOfResults(
                  e.target.value ? parseInt(e.target.value, 10) : 0
                )
              }
            />
            <Button variation="primary" onClick={onUpdate} size="small">
              Aplicar cambios
            </Button>
          </Flex>
        </Container>

        <Container heading="Seleccionar Variables y Vista Previa">
          <SelectField
            label="Selecciona una variable"
            size="small"
            value={selectedVariable}
            onChange={handleVariableChange}
          >
            {variablesList.map((variable) => (
              <option key={variable.name} value={variable.name}>
                {variable.name}
              </option>
            ))}
          </SelectField>
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {selectedContent}
          </ReactMarkdown>
        </Container>
      </Container>
    </Flex >
  );
}
