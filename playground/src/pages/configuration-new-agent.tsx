import { useState } from "react";
import {
  Button,
  CheckboxField,
  Flex,
  Loader,
  SelectField,
  SliderField,
  SwitchField,
  TextAreaField,
  TextField,
  View,
} from "@aws-amplify/ui-react";
import { Container } from "../library/container";
import { fmHandlerArns } from "../endpoints";
import { useAgentApiCreateAgent } from "../apis/agent-api/hooks/useCreateAgent";
import { useKnowledgeBase } from "../apis/agent-api";

export function ConfigurationNewAgent() {
  const [agentName, setAgentName] = useState("");
  const [agentEndpointDropdown, setAgentEndpointDropdown] = useState(
    fmHandlerArns[0].name
  );
  const [agentEndpoint, setAgentEndpoint] = useState("");
  const [systemPrompt, setSystemPrompt] = useState("");
  const createAgent = useAgentApiCreateAgent();
  const [maxTokensPerQuestion, setMaxTokensPerQuestion] = useState("");
  const [precedence, setPrecedence] = useState("1");

  const [temperature, setTemperature] = useState(0.7);
  const [topP, setTopP] = useState(0.9);
  const [maxGenLen, setMaxGenLen] = useState("2048");
  const [knowledgeBaseId, setKnowledgeBaseId] = useState("FFUYGR42Y1");
  const [IfuseKnowledgeBase, setUseKnowledgeBase] = useState(true);
  const [numberOfResults, setNumberOfResults] = useState("3");
  const KnowledgeBases = useKnowledgeBase();
  const [forceRender, setForceRender] = useState(false);

  const enabled = !!agentName;

  const onCreate = () => {
    let endpoint =
      agentEndpointDropdown === "manual"
        ? agentEndpoint
        : agentEndpointDropdown;
    createAgent({
      name: agentName,
      systemPrompt,
      handlerLambda: endpoint!,
      inputMaxToken: parseInt(maxTokensPerQuestion, 10),
      precedence: parseInt(precedence, 10),
      modelParams: {
        temperature: temperature,
        top_p: topP,
        max_gen_len: parseInt(maxGenLen, 10),
      },
      knowledgeBaseParams: {
        knowledgeBaseId: knowledgeBaseId,
        useKnowledgeBase: IfuseKnowledgeBase,
        numberOfResults: parseInt(numberOfResults, 10),
      },
    });
  };

  const handleMaxGenLenChange = (e: any) => {
    const value = e.target.value;
    if (parseInt(value, 10) <= 2048) {
      setMaxGenLen(value);
    }
  };

  const handleNumberOfResultsChange = (e: any) => {
    const value = e.target.value;
    if (parseInt(value, 10) <= 100) {
      setNumberOfResults(value);
    }
  };

  return (
    <View>
      <Container heading="New Agent">
        <TextField
          label="Agent Name"
          value={agentName}
          onChange={(e) => setAgentName(e.target.value)}
          placeholder="My Agent"
        />
        <SelectField
          label="Agent FM Handler"
          onChange={(e) => setAgentEndpointDropdown(e.target.value)}
          value={agentEndpointDropdown}
        >
          {fmHandlerArns.map((handler: any) => {
            return (
              <option key={handler.name} value={handler.name}>
                {handler.label}
              </option>
            );
          })}
          <option value="manual">Specify Custom Arn</option>
        </SelectField>
        {agentEndpointDropdown === "manual" && (
          <TextField
            label="Agent FM Handler Lambda"
            value={agentEndpoint}
            onChange={(e) => setAgentEndpoint(e.target.value)}
            placeholder="arn:aws:lambda:us-east-1:0000000:function:MyLambdaFunction"
          />
        )}
        <TextAreaField
          label="System Prompt"
          value={systemPrompt}
          onChange={(e) => setSystemPrompt(e.target.value)}
          placeholder="You are an AI agent that ...."
        />
        <TextField
          label="Max Tokens Per Question"
          value={maxTokensPerQuestion}
          onChange={(e) => setMaxTokensPerQuestion(e.target.value)}
          placeholder="1000"
        />
        <TextField
          label="Precedence"
          value={precedence}
          onChange={(e) => setPrecedence(e.target.value)}
          placeholder="1"
        />
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
          label="Max Generation Length"
          value={maxGenLen}
          onChange={handleMaxGenLenChange}
          placeholder="2048"
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
          checked={IfuseKnowledgeBase}
          onChange={(e) => setUseKnowledgeBase(e.target.checked)}
        />

        <TextField
          label="Number of Results"
          value={numberOfResults}
          onChange={handleNumberOfResultsChange}
          placeholder="3"
        />
      </Container>
      <Flex dir="row" justifyContent="flex-end">
        <Button variation="primary" onClick={onCreate} disabled={!enabled}>
          Create Agent
        </Button>
      </Flex>
    </View>
  );
}
