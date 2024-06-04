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
  const [variablesList, setVariablesList] = useRecoilState(variablesState);
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
  const [newVariableName, setNewVariableName] = useState("");
  const [newVariableValue, setNewVariableValue] = useState("");
  useEffect(() => {
    localStorage.setItem("variablesList", JSON.stringify(variablesList));
  }, [variablesList]);

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
  const handleAddVariable = () => {
    if (newVariableName && newVariableValue) {
      const newVariable = { name: newVariableName, value: newVariableValue };
      setVariablesList([...variablesList, newVariable]);
      setNewVariableName("");
      setNewVariableValue("");
    } else {
      alert("Nombre y valor de la variable son requeridos.");
    }
  };
  const handleDeleteVariable = (variableName) => {
    const updatedVariables = variablesList.filter(
      (variable) => variable.name !== variableName
    );
    setVariablesList(updatedVariables);
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

  const handleReloadExampleVariables = () => {
    const exampleVariables = [
      {
        name: "Context Case",
        value: `
In 2006, a large telecommunications company wanted to expand its Internet Protocol (IP) network to support “carrier-class services”, and more specifically high-quality voice over IP (VOIP) systems. One important aspect to achieve this goal was synchronization of the VOIP servers and other equipment. Poor synchronization results in low quality of service (QoS), degraded performance, and unhappy customers. To achieve the required level of synchronization, the company wanted to deploy a network of time servers that support the Network Time Protocol (NTP). Time servers are formed into groups that typically correspond to geographical regions. Within these regions, time servers are organized hierarchically in levels or strata, where time servers placed in the upper level of the hierarchy (stratum 1) are equipped with hardware (e.g., Cesium Oscillator, GPS signal) that provides precise time. Time servers that are lower in the hierarchy use NTP to request time from servers in the upper levels or from their peers.

Many pieces of equipment depend on the time provided by time servers in the network, so one priority for the company was to correct any problems that occur on the time servers. Such problems may require dispatching a technician to perform physical maintenance on the time servers, such as rebooting. Another priority for the company was to collect data from the time servers to monitor the performance of the synchronization framework.

In the initial deployment plans, the company wanted to field 100 time servers of a particular model. Besides NTP, time servers support the Simple Network Management Protocol (SNMP), which provides three basic operations:

- **Set() operations**: change configuration variables (e.g., connected peers)
- **Get() operations**: retrieve configuration variables or performance data
- **Trap() operations**: notifications of exceptional events such as the loss or restoration of the GPS signal or changes in the time reference

To achieve the company’s goals, a management system for the time servers needed to be developed. This system needed to conform to the FCAPS model, which is a standard model for network management. The letters in the acronym stand for:

- **Fault management**: The goal of fault management is to recognize, isolate, correct, and log faults that occur in the network. In this case, these faults correspond to traps generated by time servers or other problems such as loss of communication between the management system and the time servers.
- **Configuration management**: This includes gathering and storing configurations from network devices, thereby simplifying the configuration of devices and tracking changes that are made to device configurations. In this system, besides changing individual configuration variables, it is necessary to be able to deploy a specific configuration to several time servers.
- **Accounting**: The goal here is to gather device information. In this context, this includes tracking device hardware and firmware versions, hardware equipment, and other components of the system.
- **Performance management**: This category focuses on determining the efficiency of the current network. By collecting and analyzing performance data, the network health can be monitored. In this case, delay, offset, and jitter measures are collected from the time servers.
- **Security management**: This is the process of controlling access to assets in the network. In this case, there are two important types of users: technicians and administrators. Technicians can visualize trap information and configurations but cannot make changes; administrators are technicians who can visualize the same information but can also make changes to configurations, including adding and removing time servers from the network.

Once the initial network was deployed, the company planned to extend it by adding time servers from newer models that might potentially support management protocols other than SNMP.
    `,
      },
      {
        name: "Primary Use Cases",
        value: `
| Use Case                         | Description                                                                                                                                                                                                                                                                                                                      |
| -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| UC-1: Monitor network status     | A user monitors the time servers in a hierarchical representation of the whole network. Problematic devices are highlighted, along with the logical regions where they are grouped. The user can expand and collapse the network representation. This representation is updated continuously as faults are detected or repaired. |
| UC-2: Detect fault               | Periodically the management system contacts the time servers to see if they are “alive”. If a time server does not respond, or if a trap that signals a problem or a return to a normal state of operation is received, the event is stored and the network representation observed by the users is updated accordingly.         |
| UC-3: Display event history      | Stored events associated with a particular time server or group of time servers are displayed. These can be filtered by various criteria such as type or severity.                                                                                                                                                               |
| UC-4: Manage time servers        | The administrator adds a time server to, or removes a time server from, the network.                                                                                                                                                                                                                                             |
| UC-5: Configure time server      | An administrator changes configuration parameters associated with a particular time server. The parameters are sent to the device and are also stored locally.                                                                                                                                                                   |
| UC-6: Restore configuration      | A locally stored configuration is sent to one or more time servers.                                                                                                                                                                                                                                                              |
| UC-7: Collect performance data   | Network performance data (delay, offset, and jitter) is collected periodically from the time servers.                                                                                                                                                                                                                            |
| UC-8: Display information        | The user displays stored information about the time server—configuration values and other parameters such as the server name.                                                                                                                                                                                                    |
| UC-9: Visualize performance data | The user displays network performance measures (delay, offset, jitter) in a graphical way to view and analyze network performance.                                                                                                                                                                                               |
| UC-10: Log in                    | A user logs into the system through a login/password screen. Upon successful login, the user is presented with different options according to their role.                                                                                                                                                                        |
| UC-11: Manage users              | The administrator adds or removes a user or modifies user permissions.                                                                                                                                                                                                                                                           |
    `,
      },
      {
        name: "Quality Attribute Scenario",
        value: `
| ID    | Quality Attribute  | Scenario                                                                                                                                                                | Associated Use Case |
|-------|--------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------|---------------------|
| QA-1  | Performance        | Several time servers send traps to the management system at peak load; 100% of the traps are successfully processed and stored.                                         | UC-2                |
| QA-2  | Modifiability      | A new time server management protocol is introduced to the system as part of an update. The protocol is added successfully without any changes to the core components of the system. | UC-5                |
| QA-3  | Availability       | A failure occurs in the management system during normal operation. The management system resumes operation in less than 30 seconds.                                      | All                 |
| QA-4  | Performance        | The management system collects performance data from a time server during peak load. The management system collects all performance data within 5 minutes, while processing all user requests, to ensure no loss of data due to CON-5. | UC-7                |
| QA-5  | Performance, usability | A user displays the event history of a particular time server during normal operation. The list of events from the last 24 hours is displayed within 1 second.          | UC-3                |
| QA-6  | Security           | A user performs a change in the system during normal operation. It is possible to know who performed the operation and when it was performed 100% of the time.            | All                 |
    `,
      },

      {
        name: "Constraints",
        value: `
| ID    | Constraint                                                                                                                                                         |
|-------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| CON-1 | A minimum of 50 simultaneous users must be supported.                                                                                                              |
| CON-2 | The system must be accessed through a web browser (Chrome V3.0+, Firefox V4+, IE8+) in different platforms: Windows, OSX, and Linux.                                |
| CON-3 | An existing relational database server must be used. This server cannot be used for other purposes than hosting the database.                                       |
| CON-4 | The network connection to user workstations can have low bandwidth but is generally reliable.                                                                       |
| CON-5 | Performance data needs to be collected in intervals of no more than 5 minutes, as higher intervals result in time servers discarding data.                         |
| CON-6 | Events from the last 30 days must be stored.                                                                                                                        |
        `,
      },
      {
        name: `Architectural Concerns`,
        value: `
| ID    | Concern                                                                                                                       |
|-------|-------------------------------------------------------------------------------------------------------------------------------|
| CRN-1 | Establishing an overall initial system structure.                                                                             |
| CRN-2 | Leverage the team’s knowledge about Java technologies, including Spring, JSF, Swing, Hibernate, Java Web Start and JMS frameworks, and the Java language. |
| CRN-3 | Allocate work to members of the development team.                                                                             |`,
      },
      {
        name: "ADD 3.0 deliverable Step 1: Review inputs",
        value: `
| **Category**                        | **Details**                                                                                                                                           |
|-------------------------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------|
| **Design purpose**                  | This is a greenfield system from a mature domain. The purpose is to produce a sufficiently detailed design to support the construction of the system.  |
| **Primary functional requirements** | - UC-1: Because it directly supports the core business                                                                                                |
|                                     | - UC-2: Because it directly supports the core business                                                                                                |
|                                     | - UC-7: Because of the technical issues associated with it (see QA-4)                                                                                 |

| **Quality attribute scenarios**     | **ID** | **Quality Attribute**  | **Scenario**                                                                                                                                                                | **Associated Use Case** |
|-------------------------------------|-------|------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-------------------------|
|                                     | QA-1  | Performance            | Several time servers send traps to the management system at peak load; 100% of the traps are successfully processed and stored.                                            | UC-2                    |
|                                     | QA-2  | Modifiability          | A new time server management protocol is introduced to the system as part of an update. The protocol is added successfully without any changes to the core components of the system. | UC-5                    |
|                                     | QA-3  | Availability           | A failure occurs in the management system during normal operation. The management system resumes operation in less than 30 seconds.                                         | All                     |
|                                     | QA-4  | Performance            | The management system collects performance data from a time server during peak load. The management system collects all performance data within 5 minutes, while processing all user requests, to ensure no loss of data due to CON-5. | UC-7                    |
|                                     | QA-5  | Performance, usability | A user displays the event history of a particular time server during normal operation. The list of events from the last 24 hours is displayed within 1 second.              | UC-3                    |
|                                     | QA-6  | Security               | A user performs a change in the system during normal operation. It is possible to know who performed the operation and when it was performed 100% of the time.              | All                     |

| **Scenario ID**                     | **Importance to the Customer**                                                                                                                        | **Difficulty of Implementation According to the Architect** |
|-------------------------------------|-----------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------|
| QA-1                                | High                                                                                                                                                  | High                                                        |
| QA-2                                | High                                                                                                                                                  | Medium                                                      |
| QA-3                                | High                                                                                                                                                  | High                                                        |
| QA-4                                | High                                                                                                                                                  | High                                                        |
| QA-5                                | Medium                                                                                                                                                | Medium                                                      |
| QA-6                                | Medium                                                                                                                                                | Low                                                         |

| **Constraints**                     | **ID** | **Constraint**                                                                                                                                        |
|-------------------------------------|-------|-------------------------------------------------------------------------------------------------------------------------------------------------------|
|                                     | CON-1 | A minimum of 50 simultaneous users must be supported.                                                                                                 |
|                                     | CON-2 | The system must be accessed through a web browser (Chrome V3.0+, Firefox V4+, IE8+) in different platforms: Windows, OSX, and Linux.                   |
|                                     | CON-3 | An existing relational database server must be used. This server cannot be used for other purposes than hosting the database.                          |
|                                     | CON-4 | The network connection to user workstations can have low bandwidth but is generally reliable.                                                          |
|                                     | CON-5 | Performance data needs to be collected in intervals of no more than 5 minutes, as higher intervals result in time servers discarding data.             |
|                                     | CON-6 | Events from the last 30 days must be stored.                                                                                                           |

| **Architectural concerns**          | **ID** | **Concern**                                                                                                                                            |
|-------------------------------------|-------|-------------------------------------------------------------------------------------------------------------------------------------------------------|
|                                     | CRN-1 | Establishing an overall initial system structure.                                                                                                     |
|                                     | CRN-2 | Leverage the team’s knowledge about Java technologies, including Spring, JSF, Swing, Hibernate, Java Web Start, and JMS frameworks, and the Java language. |
|                                     | CRN-3 | Allocate work to members of the development team.                                                                                                      |
    `,
      },
    ];
    setVariablesList(exampleVariables);
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
          <Accordion.Content style={{ maxHeight: "400px", overflowY: "auto" }}>
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

            <Button onClick={handleReloadExampleVariables}>
              Recargar Variables de Ejemplo
            </Button>

            <Flex direction="column" gap={10}>
              <TextField
                label="Nombre de la nueva variable"
                placeholder="Nombre"
                size="small"
                value={newVariableName}
                onChange={(e) => setNewVariableName(e.target.value)}
              />
              <TextField
                label="Valor de la nueva variable"
                placeholder="Valor"
                size="small"
                value={newVariableValue}
                onChange={(e) => setNewVariableValue(e.target.value)}
              />
              <Button onClick={handleAddVariable}>Agregar Variable</Button>
            </Flex>

            <Flex direction="column" gap={10}>
              {variablesList.map((variable, index) => (
                <Flex key={index} direction="row" alignItems="center" gap={10}>
                  <Text>{variable.name}</Text>
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {variable.value}
                  </ReactMarkdown>

                  <Button onClick={() => handleDeleteVariable(variable.name)}>
                    Eliminar
                  </Button>
                </Flex>
              ))}
            </Flex>
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
