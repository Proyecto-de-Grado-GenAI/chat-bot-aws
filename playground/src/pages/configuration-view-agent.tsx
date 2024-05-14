import { useNavigate, useParams } from "react-router-dom";
import { Button, Flex, Loader, SliderField, SelectField, SwitchField, TextAreaField, TextField, View } from "@aws-amplify/ui-react";
import { Container } from "../library/container";
import { useAgentApiAgent } from "../apis/agent-api";
import { useAgentApiDeleteAgent } from "../apis/agent-api/hooks/useDeleteAgent";
import { useEffect, useState } from "react";
import { useAgentApiUpdateAgent } from "../apis/agent-api/hooks/useUpdateAgent";

export function ConfigurationViewAgent() {
  const { agentId } = useParams();
  const nav = useNavigate();
  const agentObject = useAgentApiAgent(agentId);
  const deleteAgent = useAgentApiDeleteAgent();
  const updateAgent = useAgentApiUpdateAgent();
  const [temperature, setTemperature] = useState(0.7);
  const [topP, setTopP] = useState(0.9);
  const [maxGenLen, setMaxGenLen] = useState(1500);
  const [systemPrompt, setSystemPrompt] = useState("Eres un asistente útil y amigable.");
  const [knowledgeBaseId, setKnowledgeBaseId] = useState("FFUYGR42Y1");
  const [useKnowledgeBase, setUseKnowledgeBase] = useState(true);
  const [numberOfResults, setNumberOfResults] = useState(3);
  const [agentName, setAgentName] = useState("");
  const [handlerLambda, setHandlerLambda] = useState("");
  const [inputMaxToken, setInputMaxToken] = useState(1000);
  const [precedence, setPrecedence] = useState(1);

  useEffect(() => {
    if (agentObject.value) {
      const agent = agentObject.value;
      setAgentName(agent.name || "");
      setHandlerLambda(agent.handlerLambda || "");
      setSystemPrompt(agent.systemPrompt || "");
      setInputMaxToken(agent.inputMaxToken || 1000);
      setPrecedence(agent.precedence || 1);
      setTemperature(agent.modelParams?.temperature || 0.7);
      setTopP(agent.modelParams?.top_p || 0.9);
      setMaxGenLen(agent.modelParams?.max_gen_len || 1500);
      setKnowledgeBaseId(agent.knowledgeBaseParams?.knowledgeBaseId || "FFUYGR42Y1");
      setUseKnowledgeBase(agent.knowledgeBaseParams?.useKnowledgeBase || true);
      setNumberOfResults(agent.knowledgeBaseParams?.numberOfResults || 3);
    }
  }, [agentObject.value]);

  if (agentObject.isUnloaded() || !agentObject.value ) {
    return <Loader />;
  }

  const onDelete = () => {
    deleteAgent(agentId).then(() => nav("/configuration"));
  };

  const onUpdate = () => {
    const updatedAgent = {
      name: agentName || "",
      handlerLambda: handlerLambda || "",
      systemPrompt: systemPrompt || "",
      inputMaxToken: inputMaxToken || 1000,
      precedence: precedence || 1,
      modelParams: {
        temperature: temperature || 0.7,
        top_p: topP || 0.9,
        max_gen_len: maxGenLen || 1500,
      },
      knowledgeBaseParams: {
        knowledgeBaseId: knowledgeBaseId || "FFUYGR42Y1",
        useKnowledgeBase: useKnowledgeBase || true,
        numberOfResults: numberOfResults || 3,
      },
    };
    updateAgent(agentId!, updatedAgent)
      .then(() => {
        // Handle successful update, e.g., navigate to another page or show a success message
        alert("Agent updated successfully!");
      })
      .catch((error) => {
        // Handle error in update
        alert(`Failed to update agent: ${error.message}`);
      });
  };

  return (
    <View>
      <Container heading="View Agent">
        <TextField
          label="Agent Name"
          value={agentName}
          placeholder="My Agent"
          onChange={(e) => setAgentName(e.target.value)}
        />
        <TextField
          label="Agent FM Handler"
          value={handlerLambda}
          placeholder="arn:aws:lambda:us-east-1:0000000:function:MyLambdaFunction"
          onChange={(e) => setHandlerLambda(e.target.value)}
        />
        <TextAreaField
          label="System Prompt"
          value={systemPrompt}
          placeholder="My Prompt"
          rows={5}
          onChange={(e) => setSystemPrompt(e.target.value)}
        />
        <TextField
          label="Max Tokens Per Question"
          value={inputMaxToken}
          placeholder="1000"
          onChange={(e) => setInputMaxToken(parseInt(e.target.value, 10))}
        />
        <TextField
          label="Precedence"
          value={precedence}
          placeholder="1"
          onChange={(e) => setPrecedence(parseInt(e.target.value, 10))}
        />
        <Container heading="Parámetros del Modelo">
          <Flex direction="column" gap={10}>
            <SliderField
              label="Temperature"
              min={0}
              max={1}
              step={0.01}
              value={temperature}
              onChange={(value) => setTemperature(value)}
            />
            <SliderField
              label="Top P"
              min={0}
              max={1}
              step={0.01}
              value={topP}
              onChange={(value) => setTopP(value)}
            />
            <TextField
              label="Max Gen Len"
              placeholder="1500"
              size="small"
              value={maxGenLen}
              onChange={(e) => setMaxGenLen(parseInt(e.target.value, 10))}
            />
            <SelectField
              label="Knowledge Base ID"
              placeholder="Selecciona una base de conocimiento"
              value={knowledgeBaseId}
              onChange={(e) => setKnowledgeBaseId(e.target.value)}
            >
              <option value="FFUYGR42Y1">Base de Conocimiento 1</option>
              <option value="OtroId">Base de Conocimiento 2</option>
            </SelectField>
            <SwitchField
              label="Use Knowledge Base"
              isChecked={useKnowledgeBase}
              onChange={(e) => setUseKnowledgeBase(e.target.checked)}
            />
            <TextField
              label="Number of Results"
              placeholder="3"
              size="small"
              value={numberOfResults}
              onChange={(e) => setNumberOfResults(parseInt(e.target.value, 10))}
            />
          </Flex>
        </Container>
      </Container>
      <Flex direction="row" justifyContent="end" padding="1rem">
        <Button variation="primary" onClick={onUpdate} size="small">
          Update Agent
        </Button>
        <Button variation="warning" onClick={onDelete} size="small">
          Delete Agent
        </Button>
      </Flex>
    </View>
  );
}
