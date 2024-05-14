import { useState } from "react";
import {
  Button,
  Flex,
  Loader,
  SelectField,
  TextAreaField,
  TextField,
  View,
} from "@aws-amplify/ui-react";
import { Container } from "../library/container";
import { fmHandlerArns } from "../endpoints";
import { useAgentApiCreateAgent } from "../apis/agent-api/hooks/useCreateAgent";

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

  // Campos adicionales
  const [temperature, setTemperature] = useState("0.7");
  const [topP, setTopP] = useState("0.9");
  const [maxGenLen, setMaxGenLen] = useState("1500");
  const [knowledgeBaseId, setKnowledgeBaseId] = useState("FFUYGR42Y1");
  const [useKnowledgeBase, setUseKnowledgeBase] = useState(true);
  const [numberOfResults, setNumberOfResults] = useState("3");

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
        temperature: parseFloat(temperature),
        top_p: parseFloat(topP),
        max_gen_len: parseInt(maxGenLen, 10),
      },
      knowledgeBaseParams: {
        knowledgeBaseId,
        useKnowledgeBase,
        numberOfResults: parseInt(numberOfResults, 10),
      },
    });
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

        {/* Campos adicionales */}
        <TextField
          label="Temperature"
          value={temperature}
          onChange={(e) => setTemperature(e.target.value)}
          placeholder="0.7"
        />
        <TextField
          label="Top P"
          value={topP}
          onChange={(e) => setTopP(e.target.value)}
          placeholder="0.9"
        />
        <TextField
          label="Max Generation Length"
          value={maxGenLen}
          onChange={(e) => setMaxGenLen(e.target.value)}
          placeholder="1500"
        />
        <TextField
          label="Knowledge Base ID"
          value={knowledgeBaseId}
          onChange={(e) => setKnowledgeBaseId(e.target.value)}
          placeholder="FFUYGR42Y1"
        />
        <SelectField
          label="Use Knowledge Base"
          onChange={(e) => setUseKnowledgeBase(e.target.value === "true")}
          value={useKnowledgeBase ? "true" : "false"}
        >
          <option value="true">Yes</option>
          <option value="false">No</option>
        </SelectField>
        <TextField
          label="Number of Results"
          value={numberOfResults}
          onChange={(e) => setNumberOfResults(e.target.value)}
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
