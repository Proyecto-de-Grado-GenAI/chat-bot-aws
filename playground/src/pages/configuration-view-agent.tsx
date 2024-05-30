import { useNavigate, useParams } from "react-router-dom";
import {
  Button,
  Flex,
  Loader,
  SliderField,
  SelectField,
  TextAreaField,
  TextField,
  View,
  CheckboxField,
  Card,
} from "@aws-amplify/ui-react";
import { Container } from "../library/container";
import { useAgentApiAgent, useKnowledgeBase } from "../apis/agent-api";
import { useAgentApiDeleteAgent } from "../apis/agent-api/hooks/useDeleteAgent";
import { useEffect, useState } from "react";
import { useAgentApiUpdateAgent } from "../apis/agent-api/hooks/useUpdateAgent";
import { AgentPhase } from "../apis/agent-api/types";

export function ConfigurationViewAgent() {
  const { agentId } = useParams();
  const nav = useNavigate();
  const agentObject = useAgentApiAgent(agentId);
  const deleteAgent = useAgentApiDeleteAgent();
  const updateAgent = useAgentApiUpdateAgent();
  const [temperature, setTemperature] = useState<number | null>(null);
  const [topP, setTopP] = useState<number | null>(null);
  const [maxGenLen, setMaxGenLen] = useState(1500);
  const [systemPrompt, setSystemPrompt] = useState(
    "Eres un asistente útil y amigable."
  );
  const [knowledgeBaseId, setKnowledgeBaseId] = useState("FFUYGR42Y1");
  const [ifuseKnowledgeBase, setUseKnowledgeBase] = useState(true);
  const [numberOfResults, setNumberOfResults] = useState(3);
  const [agentName, setAgentName] = useState("");
  const [handlerLambda, setHandlerLambda] = useState("");
  const [inputMaxToken, setInputMaxToken] = useState(1000);
  const [precedence, setPrecedence] = useState(1);
  const [forceRender, setForceRender] = useState(false);
  const KnowledgeBases = useKnowledgeBase();
  const [phases, setPhases] = useState<AgentPhase[]>([]);
  const [phaseName, setPhaseName] = useState("");
  const [phaseInstruction, setPhaseInstruction] = useState("");
  const [phaseDescription, setPhaseDescription] = useState("");
  const [expandedPhaseIndex, setExpandedPhaseIndex] = useState<number | null>(
    null
  );

  useEffect(() => {
    if (agentObject.value) {
      const agent = agentObject.value;

      console.log("agent: ", agent);

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
      console.log("agent.phases: ", agent.phases);
      setPhases(agent.phases || []);
      setForceRender((prev) => !prev); // Toggle force render
    }
  }, [agentObject.value]);

  const handleAddPhase = () => {
    if (phaseName && phaseDescription && phaseInstruction) {
      setPhases([
        ...phases,
        {
          name: phaseName,
          description: phaseDescription,
          instruccion: phaseInstruction,
        },
      ]);
      setPhaseName("");
      setPhaseDescription("");
      setPhaseInstruction("");
    }
  };

  useEffect(() => {
    console.log("ifuseKnowledgeBase state updated: ", ifuseKnowledgeBase);
  }, [ifuseKnowledgeBase]);

  if (agentObject.isUnloaded() || !agentObject.value) {
    return <Loader />;
  }

  const onDelete = () => {
    deleteAgent(agentId).then(() => nav("/configuration"));
  };
  const handleToggleExpand = (index: number) => {
    setExpandedPhaseIndex(expandedPhaseIndex === index ? null : index);
  };

  const handleRemovePhase = (index: number) => {
    const newPhases = phases.filter((_, i) => i !== index);
    setPhases(newPhases);
  };

  const onUpdate = () => {
    const updatedAgent = {
      id: agentId!,
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
        useKnowledgeBase: ifuseKnowledgeBase,
        numberOfResults: numberOfResults,
      },
      phases: phases.map((phase) => ({
        name: phase.name,
        description: phase.description,
        instruccion: phase.instruccion,
      })),
    };

    updateAgent(updatedAgent)
      .then(() => {
        alert("Agent updated successfully!");
      })
      .catch((error) => {
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
          isDisabled
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
          value={inputMaxToken.toString()}
          placeholder="1000"
          onChange={(e) => setInputMaxToken(parseInt(e.target.value, 10))}
        />
        <TextField
          label="Precedence"
          value={precedence.toString()}
          placeholder="1"
          onChange={(e) => setPrecedence(parseInt(e.target.value, 10))}
        />
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
              value={maxGenLen.toString()}
              onChange={(e) => setMaxGenLen(parseInt(e.target.value, 10))}
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
              checked={ifuseKnowledgeBase}
              onChange={(e) => setUseKnowledgeBase(e.target.checked)}
            />
            <TextField
              label="Number of Results"
              placeholder="3"
              size="small"
              value={numberOfResults.toString()}
              onChange={(e) => setNumberOfResults(parseInt(e.target.value, 10))}
            />
          </Flex>
          <Container heading="Phases">
            <View>
              <TextField
                label="Phase Name"
                value={phaseName}
                onChange={(e) => setPhaseName(e.target.value)}
                placeholder="Phase Name"
              />
              <TextAreaField
                label="Phase Description"
                value={phaseDescription}
                onChange={(e) => setPhaseDescription(e.target.value)}
                placeholder="Phase Description"
              />
              <Button onClick={handleAddPhase}>Add Phase</Button>
              <View marginTop="20px">
                <h3>Phases</h3>
                <Flex direction="row" gap={10}>
                  {phases.map((phase, index) => (
                    <Flex
                      key={index}
                      padding="10px"
                      border="1px solid lightgray"
                      borderRadius="5px"
                      backgroundColor="white"
                      direction="column"
                      position="relative"
                      width={expandedPhaseIndex === index ? "100%" : "300px"}
                      maxWidth="500px"
                      style={{ wordBreak: "break-word" }}
                    >
                      <strong>{phase.name}</strong>
                      <p
                        style={{
                          overflow:
                            expandedPhaseIndex === index ? "visible" : "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace:
                            expandedPhaseIndex === index ? "normal" : "nowrap",
                          display:
                            expandedPhaseIndex === index
                              ? "block"
                              : "-webkit-box",
                          WebkitLineClamp:
                            expandedPhaseIndex === index ? "unset" : 3,
                          WebkitBoxOrient: "vertical",
                        }}
                      >
                        {phase.description}
                      </p>
                      <p
                        style={{
                          overflow:
                            expandedPhaseIndex === index ? "visible" : "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace:
                            expandedPhaseIndex === index ? "normal" : "nowrap",
                          display:
                            expandedPhaseIndex === index
                              ? "block"
                              : "-webkit-box",
                          WebkitLineClamp:
                            expandedPhaseIndex === index ? "unset" : 3,
                          WebkitBoxOrient: "vertical",
                        }}
                      >
                        <strong>Instrucción:</strong> {phase.instruccion}
                      </p>
                      <Button
                        size="small"
                        variation="link"
                        onClick={() => handleToggleExpand(index)}
                        padding="0"
                        margin="0"
                        alignSelf="flex-start"
                      >
                        {expandedPhaseIndex === index
                          ? "Show less"
                          : "Show more"}
                      </Button>
                      <Button
                        size="small"
                        variation="link"
                        onClick={() => handleRemovePhase(index)}
                        position="absolute"
                        top="5px"
                        right="5px"
                        padding="0"
                        margin="0"
                      >
                        Remove
                      </Button>
                    </Flex>
                  ))}
                </Flex>
              </View>
            </View>
          </Container>
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
