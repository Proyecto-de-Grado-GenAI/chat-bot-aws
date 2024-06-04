import { useEffect, useState } from "react";
import { useRecoilState } from "recoil";
import { useNavigate, useParams, Outlet } from "react-router-dom";
import {
  useAgentApiAgentList,
  useAgentApiConversationList,
  useAgentApiSendMessage,
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
  Accordion,
  Text,
} from "@aws-amplify/ui-react";
import { Container } from "../library/container";
import remarkGfm from "remark-gfm";
import ReactMarkdown from "react-markdown";
import CustomStorageManager from "../components/CustomStorageManager";
import { AgentApiConversationListed } from "../library/chat/conversation-listed";
import {
  activeConversationsState,
  selectedLlmState,
  selectedAgentState,
  variablesState,
  selectedAgentPhaseState,
  selectedIterationState,
  phaseExecutedState,
} from "../apis/agent-api/state";
import {
  AgentPhase,
  IterationInput,
  systemElement,
} from "../apis/agent-api/types";
import { useAgentApiUpdateAgent } from "../apis/agent-api/hooks/useUpdateAgent";
import { useIterationApiIterationList } from "../apis/agent-api/hooks/useIterations";
import { useAgentApiCreateIteration } from "../apis/agent-api/hooks/useCreateIteration";
import { useAgentApiDeleteIteration } from "../apis/agent-api/hooks/useDeleteIteration";
import Markdown from "react-markdown";
import { useIterationApiUpdateIteration } from "../apis/agent-api/hooks/updateIteration";

export function AIAgentSidebar() {
  const { chatId } = useParams();

  const conversationsObject = useAgentApiConversationList();
  const agentObjectList = useAgentApiAgentList();
  const submitMessage = useAgentApiSendMessage(chatId);
  const LLmsObject = useLLmList();
  const updateAgent = useAgentApiUpdateAgent();
  const IterationsList = useIterationApiIterationList();
  const etapas = [
    { name: "Comprensión", precedence: 1 },
    { name: "Diseño", precedence: 2 },
    { name: "Diseño Detallado", precedence: 3 },
    // Añade más etapas según sea necesario
  ];

  const [selectedLlm, setSelectedLlm] = useRecoilState(selectedLlmState);
  const [isDesignSelectable, setIsDesignSelectable] = useState(false);
  const [selectedAgent, setSelectedAgent] = useRecoilState(selectedAgentState);
  const [lastSelectedAgentId, setLastSelectedAgentId] = useState<string | null>(
    null
  );
  const [agentConversations, setAgentConversations] = useRecoilState(
    activeConversationsState
  );
  const [isEditing, setIsEditing] = useState(false);

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
  const [phases, setPhases] = useState<AgentPhase[]>([]);
  const [selectedPhase, setSelectedPhase] = useRecoilState(
    selectedAgentPhaseState
  );
  const [selectedIteration, setSelectedIteration] = useRecoilState(
    selectedIterationState
  );
  const [phaseExecuted, setPhaseExecuted] = useRecoilState(phaseExecutedState);

  const addIteration = useAgentApiCreateIteration();
  const deleteIteration = useAgentApiDeleteIteration();
  const updateIteration = useIterationApiUpdateIteration();

  const [newIterationObjective, setNewIterationObjective] = useState("");

  const [newSystemElementName, setNewSystemElementName] = useState("");
  const [newSystemElementDescription, setNewSystemElementDescription] =
    useState("");

  const [newSystemElements, setNewSystemElements] = useState<systemElement[]>(
    []
  );
  const [deletedSystemElements, setDeletedSystemElements] = useState<
    systemElement[]
  >([]);
  const [showFullDescription, setShowFullDescription] = useState(false);

  const selectedContent =
    variablesList.find((variable) => variable.name === selectedVariable)
      ?.value || "";

  const handleVariableChange = (event: any) => {
    setSelectedVariable(event.target.value);
  };

  const handlePhaseChange = (event: any) => {
    const phase = phases.find((phase) => phase.name === event.target.value);
    setSelectedPhase(phase || null);
  };

  const KnowledgeBases = useKnowledgeBase();

  const nav = useNavigate();

  const onUpdate = () => {
    const updatedAgent = {
      id: selectedAgent?.id!,
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
      phases: phases.map((phase) => ({
        name: phase.name,
        description: phase.description,
        instruccion: phase.instruccion,
      })),
    };

    updateAgent(updatedAgent)
      .then(() => { })
      .catch((error) => {
        alert(`Failed to update agent: ${error.message}`);
      });
  };

  useEffect(() => {
    if (selectedAgent) {
      const {
        name,
        handlerLambda,
        systemPrompt,
        inputMaxToken,
        precedence,
        modelParams,
        knowledgeBaseParams,
        phases,
      } = selectedAgent;
      setAgentName(name || "");
      setHandlerLambda(handlerLambda || "");
      setSystemPrompt(systemPrompt || "Eres un asistente útil y amigable.");
      setInputMaxToken(inputMaxToken || 1000);
      setPrecedence(precedence || 1);
      setTemperature(modelParams?.temperature ?? 0.7);
      setTopP(modelParams?.top_p ?? 0.9);
      setMaxGenLen(modelParams?.max_gen_len || 1500);
      setKnowledgeBaseId(knowledgeBaseParams?.knowledgeBaseId || "FFUYGR42Y1");
      setUseKnowledgeBase(knowledgeBaseParams?.useKnowledgeBase ?? true);
      setNumberOfResults(knowledgeBaseParams?.numberOfResults || 3);
      setPhases(phases || []);
      setSelectedPhase(phases ? phases[0] : null); // Select the first phase by default
      setForceRender((prev) => !prev);
    }
  }, [selectedAgent, setSelectedPhase]);

  useEffect(() => {
    if (agentObjectList.value) {
      const initialAgent =
        agentObjectList.value.items().find((agent) => agent.precedence === 1) ||
        null;
      setSelectedAgent(initialAgent);
    }
  }, [agentObjectList.value, setSelectedAgent]);

  useEffect(() => {
    if (IterationsList.value) {
      const initialIteration =
        IterationsList.value.items().length > 0
          ? IterationsList.value.items()[0]
          : null;
      setSelectedIteration(initialIteration);
    }
  }, [IterationsList.value, setSelectedIteration]);

  useEffect(() => {
    if (selectedIteration && IterationsList.value) {
      const iteration = IterationsList.value
        .items()
        .find((iteration) => iteration.id === selectedIteration.id);
      setSelectedIteration(iteration || null);
    }
  }, [IterationsList.value, selectedIteration, setSelectedIteration]);

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

  useEffect(() => {
    if (LLmsObject.value) {
      const llama70B =
        LLmsObject.value.items().find((llm) => llm.name === "LLama-3-70B") ||
        null;
      setSelectedLlm(llama70B);
    }
  }, [LLmsObject.value, setSelectedLlm]);

  useEffect(() => {
    const hasRequiredVariable = variablesList.some(
      (variable) =>
        variable.name === "ADD 3.0 deliverable Step 1: Review inputs"
    );
    const hasIteration = selectedIteration !== null;

    setIsDesignSelectable(hasRequiredVariable && hasIteration);
  }, [variablesList, selectedIteration]);

  const handleExecutePhase = () => {
    if (!selectedPhase) {
      alert("No hay una fase seleccionada. Por favor, selecciona una fase.");
      return;
    }

    if (!selectedLlm) {
      alert("No hay un LLM seleccionado. Por favor, selecciona un LLM.");
      return;
    }
    if (!selectedIteration) {
      alert("No hay una iteración seleccionada. Por favor, selecciona una.");
      return;
    }
    if (!selectedAgent) {
      alert("No hay un agente seleccionado. Por favor, selecciona un agente.");
      return;
    }

    const iterationInput: IterationInput = {
      number: selectedIteration!.number,
      name: selectedIteration!.name,
      objetive: selectedIteration!.objetive,
      systemElements: selectedIteration.systemElements || [],
    };

    const payload = {
      message: selectedPhase.instruccion,
      model: selectedLlm,
      modelParams: {
        temperature: temperature,
        top_p: topP,
        max_gen_len: maxGenLen,
      },
      systemPrompt: systemPrompt,
      knowledgeBaseParams: {
        knowledgeBaseId: knowledgeBaseId,
        useKnowledgeBase: IfUseKnowledgeBase,
        numberOfResults: numberOfResults,
      },
      variables: variablesList,
      agentPhase: selectedPhase,
      Iteration: iterationInput,
      executePhase: true,
    };

    console.log("Payload: ", payload);

    submitMessage(payload);
    setPhaseExecuted(true);
  };

  const handleAddIteration = () => {
    const newIteration = {
      number: (IterationsList.value?.items().length || 0) + 1,
      objetive: newIterationObjective,
      name: "Iteración " + (IterationsList.value?.items().length || 1),
    };
    addIteration(newIteration)
      .then(() => {
        alert("Iteración agregada exitosamente!");
        setNewIterationObjective("");
      })
      .catch((error) => {
        alert(`Error al agregar la iteración: ${error.message}`);
      });
  };

  const handleUpdateIteration = () => {
    if (selectedIteration) {
      const updatedIteration = {
        ...selectedIteration,
        objetive: newIterationObjective || selectedIteration.objetive,
        systemElements:
          [
            ...(selectedIteration.systemElements || []),
            ...newSystemElements,
          ].filter((element) => !deletedSystemElements.includes(element)) || [],
      };
      updateIteration(updatedIteration)
        .then(() => {
          alert("Iteración actualizada exitosamente!");
          setNewIterationObjective("");
          setNewSystemElements([]);
          setDeletedSystemElements([]);
        })
        .catch((error) => {
          alert(`Error al actualizar la iteración: ${error.message}`);
        });
    } else {
      alert("No hay una iteración seleccionada para actualizar.");
    }
  };

  const handleDeleteSystemElement = (index, isExisting) => {
    if (isExisting && selectedIteration) {
      const elementToDelete = selectedIteration.systemElements[index];

      if (!deletedSystemElements.includes(elementToDelete)) {
        setDeletedSystemElements([...deletedSystemElements, elementToDelete]);
        const updatedSystemElements = selectedIteration.systemElements.filter(
          (_, i) => i !== index
        );

        setSelectedIteration({
          ...selectedIteration,
          systemElements: updatedSystemElements,
        });
      } else {
        alert("El elemento ya está en la lista de eliminados.");
      }
    } else {
      const elementToDelete = newSystemElements[index];

      // Verifica si el elemento ya está en la lista de eliminados
      if (!deletedSystemElements.includes(elementToDelete)) {
        setDeletedSystemElements([...deletedSystemElements, elementToDelete]);
        setNewSystemElements(newSystemElements.filter((_, i) => i !== index));
      } else {
        alert("El elemento ya está en la lista de eliminados.");
      }
    }
  };

  const handleDeleteIteration = () => {
    if (selectedIteration) {
      deleteIteration(selectedIteration.id)
        .then(() => {
          alert("Iteración borrada exitosamente!");
          setSelectedIteration(null);
        })
        .catch((error) => {
          alert(`Error al borrar la iteración: ${error.message}`);
        });
    } else {
      alert("No hay una iteración seleccionada para borrar.");
    }
  };

  const handleAddSystemElement = () => {
    if (selectedIteration) {
      const newElement: systemElement = {
        name: newSystemElementName,
        description: newSystemElementDescription,
      };
      setNewSystemElements([...newSystemElements, newElement]);

      setNewSystemElementName("");
      setNewSystemElementDescription("");
    }
  };

  if (
    conversationsObject.isUnloaded() ||
    !conversationsObject.value ||
    agentObjectList.isUnloaded() ||
    !agentObjectList.value ||
    LLmsObject.isUnloaded() ||
    !LLmsObject.value ||
    KnowledgeBases.isUnloaded() ||
    !KnowledgeBases.value ||
    IterationsList.isUnloaded() ||
    !IterationsList.value
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

  const sortedAgents = agentObjectList.value
    ?.items()
    .slice()
    .sort((a, b) => a.precedence - b.precedence);

  const isHigherPrecedenceDisabled = (precedence) => {
    return sortedAgents.some(
      (agent) =>
        agent.precedence < precedence &&
        agent.name === "Diseño" &&
        !isDesignSelectable
    );
  };

  const heading = `LLM: ${selectedLlm?.name || "No LLM selected"} - Agente: ${selectedAgent?.name || "No agent selected"
    }`;

  return (
    <Flex>
      <Accordion.Container
        allowMultiple
        width="60%"
        defaultValue={["Tu LLM", "Tus conversaciones", "Seleccionar iteración"]}
      >
        <Accordion.Item value="Tu LLM">
          <Accordion.Trigger>
            Select LLM
            <Accordion.Icon />
          </Accordion.Trigger>

          <Accordion.Content>
            <SelectField
              label="Selecciona un LLM"
              size="small"
              value={selectedLlm ? selectedLlm.id : ""}
              onChange={(e) => {
                const selected = LLmsObject.value!.items().find(
                  (llm) => llm.id === e.target.value
                );
                setSelectedLlm(selected || null);
              }}
            >
              <option value="">Selecciona tu LLM</option>
              {LLmsObject.value.items().map((llm) => (
                <option key={llm.id} value={llm.id}>
                  {llm.name}
                </option>
              ))}
            </SelectField>
          </Accordion.Content>
        </Accordion.Item>

        <Accordion.Item value="Tus conversaciones">
          <Accordion.Trigger>
            Tus conversaciones
            <Accordion.Icon />
          </Accordion.Trigger>
          <Accordion.Content>
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
          </Accordion.Content>
        </Accordion.Item>

        <Accordion.Item value="Seleccionar Drivers y Vista Previa">
          <Accordion.Trigger>
            Seleccionar Drivers y Vista Previa
            <Accordion.Icon />
          </Accordion.Trigger>
          <Accordion.Content>
            <SelectField
              label="Selecciona un Driver"
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
          </Accordion.Content>
        </Accordion.Item>
      </Accordion.Container>

      <Container heading={heading} width="100%">
        {selectedAgent?.name !== "Exploración" && (
          <Text fontWeight="bold" fontSize="medium" padding="small">
            {selectedIteration ? (
              <>
                <Text as="span" fontWeight="normal">
                  Número de iteración:{" "}
                </Text>
                {selectedIteration.number || "N/A"}
                <br />
                <Text as="span" fontWeight="normal">
                  Objetivo:{" "}
                </Text>
                {selectedIteration.objetive || "N/A"}
              </>
            ) : (
              "No hay iteración seleccionada"
            )}
          </Text>
        )}
        <Outlet />
      </Container>

      <Accordion.Container
        allowMultiple
        width="70%"
        defaultValue={[
          "Etapas",
          "Fases",
          "Selecciona la iteración",
          "Sube tus documentos",
          "Seleccionar elementos del sistema",
        ]}
      >
        <Accordion.Item value="Etapas">
          <Accordion.Trigger>
            Selecccionar Etapa
            <Accordion.Icon />
          </Accordion.Trigger>
          <Accordion.Content>
            <Flex direction="row" gap={5}>
              {sortedAgents.map((agent) => (
                <Button
                  key={agent.id}
                  onClick={() => setSelectedAgent(agent)}
                  isDisabled={
                    (agent.name === "Diseño" && !isDesignSelectable) ||
                    isHigherPrecedenceDisabled(agent.precedence)
                  }
                >
                  {agent.name}
                </Button>
              ))}
            </Flex>
          </Accordion.Content>
        </Accordion.Item>

        {selectedAgent?.name === "Comprensión" && (
          <>
            {selectedPhase?.name.includes("Step 1: Review Inputs") && (
              <Accordion.Item value="Sube tus documentos">
                <Accordion.Trigger>
                  Sube tus documentos
                  <Accordion.Icon />
                </Accordion.Trigger>
                <Accordion.Content>
                  <CustomStorageManager />
                </Accordion.Content>
              </Accordion.Item>
            )}
            {selectedPhase?.name.includes(
              "Step 2: Establish Iteration Goal by Selecting Drivers"
            ) && (
                <Accordion.Item value="Selecciona la iteración">
                  <Accordion.Trigger>
                    Seleccionar iteración
                    <Accordion.Icon />
                  </Accordion.Trigger>
                  <Accordion.Content>
                    <SelectField
                      label="Selecciona una iteración"
                      size="small"
                      value={selectedIteration ? selectedIteration.id : ""}
                      onChange={(e) => {
                        const selected = IterationsList.value
                          ?.items()
                          .find((iteration) => iteration.id === e.target.value);
                        setSelectedIteration(selected || null);
                      }}
                    >
                      <option value="">Selecciona una iteración</option>
                      {IterationsList.value?.items().map((iteration) => (
                        <option key={iteration.id} value={iteration.id}>
                          {iteration.name}
                        </option>
                      ))}
                    </SelectField>
                    <TextField
                      label="Nuevo objetivo de iteración"
                      placeholder="Describe el objetivo"
                      size="small"
                      value={newIterationObjective}
                      onChange={(e) => setNewIterationObjective(e.target.value)}
                    />

                    <Flex direction="row" gap={10}>
                      <Button onClick={handleAddIteration}>
                        Agregar Iteración
                      </Button>
                      <Button
                        onClick={handleDeleteIteration}
                        disabled={!selectedIteration}
                      >
                        Borrar Iteración
                      </Button>
                      <Button
                        onClick={handleUpdateIteration}
                        disabled={!selectedIteration}
                      >
                        Actualizar Iteración
                      </Button>
                    </Flex>
                  </Accordion.Content>
                </Accordion.Item>
              )}
          </>
        )}
        {selectedAgent?.name === "Diseño" && (
          <>
            {selectedPhase?.name.includes(
              "Step 3: Choose One or More Elements of the System to Refine"
            ) && (
                <Accordion.Item value="Seleccionar elementos del sistema">
                  <Accordion.Trigger>
                    Seleccionar elementos del sistema
                    <Accordion.Icon />
                  </Accordion.Trigger>
                  <Accordion.Content>
                    <TextField
                      label="Nuevo nombre del elemento del sistema"
                      placeholder="Nombre del elemento"
                      size="small"
                      value={newSystemElementName}
                      onChange={(e) => setNewSystemElementName(e.target.value)}
                    />
                    <TextField
                      label="Nueva descripción del elemento del sistema"
                      placeholder="Descripción del elemento"
                      size="small"
                      value={newSystemElementDescription}
                      onChange={(e) =>
                        setNewSystemElementDescription(e.target.value)
                      }
                    />
                    <Flex direction="row" gap={10}>
                      <Button onClick={handleAddSystemElement}>
                        Agregar Elemento del Sistema
                      </Button>
                      <Button
                        onClick={handleUpdateIteration}
                        disabled={!selectedIteration}
                      >
                        Actualizar Iteración
                      </Button>
                    </Flex>

                    <Flex direction="column" gap={10}>
                      {newSystemElements.length > 0 && (
                        <ul>
                          <Text fontWeight="bold">
                            Elementos del sistema nuevos:
                          </Text>
                          {newSystemElements.map((element, index) => (
                            <li key={index}>
                              <Text fontWeight="bold">{element.name}</Text>
                              <Text>{element.description}</Text>
                              <Button
                                onClick={() =>
                                  handleDeleteSystemElement(index, false)
                                }
                              >
                                Eliminar
                              </Button>
                            </li>
                          ))}
                        </ul>
                      )}

                      {(selectedIteration?.systemElements?.length ?? 0) > 0 && (
                        <ul>
                          <Text fontWeight="bold">Elementos del sistema:</Text>
                          {selectedIteration?.systemElements?.map(
                            (element, index) => (
                              <li key={index}>
                                <Text fontWeight="bold">{element.name}</Text>
                                <Text>{element.description}</Text>
                                <Button
                                  onClick={() =>
                                    handleDeleteSystemElement(index, true)
                                  }
                                >
                                  Eliminar
                                </Button>
                              </li>
                            )
                          )}
                        </ul>
                      )}

                      {deletedSystemElements.length > 0 && (
                        <ul>
                          <Text fontWeight="bold">
                            Elementos del sistema borrados:
                          </Text>
                          {deletedSystemElements.map((element, index) => (
                            <li key={index}>
                              <Text fontWeight="bold">{element.name}</Text>
                              <Text>{element.description}</Text>
                            </li>
                          ))}
                        </ul>
                      )}
                    </Flex>
                  </Accordion.Content>
                </Accordion.Item>
              )}
          </>
        )}
        {selectedAgent?.name !== "Exploración" && (
          <Accordion.Item value="Fases">
            <Accordion.Trigger>
              Seleccionar Fase
              <Accordion.Icon />
            </Accordion.Trigger>
            <Accordion.Content>
              <Flex direction="column" gap={10}>
                <SelectField
                  label="Selecciona una fase"
                  size="small"
                  value={selectedPhase ? selectedPhase.name : ""}
                  onChange={handlePhaseChange}
                >
                  <option value="">Selecciona una fase</option>
                  {phases.map((phase) => (
                    <option key={phase.name} value={phase.name}>
                      {phase.name}
                    </option>
                  ))}
                </SelectField>
                <Text fontSize="medium">Descripción de la fase:</Text>
                <Markdown>
                  {showFullDescription
                    ? selectedPhase?.description
                    : `${selectedPhase?.description?.slice(0, 100)}...`}
                </Markdown>
                <Button
                  onClick={() => setShowFullDescription(!showFullDescription)}
                >
                  {showFullDescription ? "Ver Menos" : "Ver Más"}
                </Button>
                <Button onClick={handleExecutePhase} variation="primary">
                  Ejecutar Fase
                </Button>
              </Flex>
            </Accordion.Content>
          </Accordion.Item>
        )}

        <Accordion.Item value="Parámetros del modelo">
          <Accordion.Trigger>
            Ver parámetros del modelo
            <Accordion.Icon />
          </Accordion.Trigger>
          <Accordion.Content>
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

              {isEditing ? (
                <TextAreaField
                  label="System Prompt"
                  value={systemPrompt}
                  onChange={(e) => setSystemPrompt(e.target.value)}
                />
              ) : (
                <>
                  <Text fontSize="medium">System Prompt:</Text>
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {systemPrompt}
                  </ReactMarkdown>
                </>
              )}

              <Button onClick={() => setIsEditing(!isEditing)}>
                {isEditing ? "Guardar" : "Editar"}
              </Button>
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
          </Accordion.Content>
        </Accordion.Item>
      </Accordion.Container>
    </Flex>
  );
}
