import { atom } from "recoil";
import * as TAgentApi from "./types";

/*
    Loadable indicates a value can have a loading state
*/
export class Loadable<T> {
  public loading: "unloaded" | "loading" | "loaded";
  public value: T | undefined;

  constructor(
    loading: "unloaded" | "loading" | "loaded",
    value: T | undefined
  ) {
    this.loading = loading;
    this.value = value;
  }

  public isLoaded(): boolean {
    return this.loading === "loaded";
  }

  public isUnloaded(): boolean {
    return this.loading === "unloaded";
  }

  public static unloaded<T>(): Loadable<T> {
    return new Loadable<T>("unloaded", undefined);
  }

  public static loading<T>(): Loadable<T> {
    return new Loadable<T>("loading", undefined);
  }

  public static loaded<T>(value: T): Loadable<T> {
    return new Loadable<T>("loaded", value);
  }
}

/*
    Record Type 
*/

export class ObjRecord<T extends { id: string }> {
  private constructor(private value: Record<string, T>) {}

  public static of<T extends { id: string }>(items: T[]) {
    let mapping = {} as Record<string, T>;
    for (let item of items) {
      mapping[item.id] = item;
    }
    return new ObjRecord(mapping);
  }

  public static empty<T extends { id: string }>() {
    return new ObjRecord<T>({});
  }

  public get(id: string): T {
    return this.value[id] as T;
  }

  public items(): T[] {
    return Object.values(this.value);
  }

  public map(fn: (item: T) => any): any[] {
    return Object.values(this.value).map(fn);
  }

  public ids(): string[] {
    return Object.keys(this.value);
  }

  public without(id: string): ObjRecord<T> {
    let all = this.items();
    let without = all.filter((item) => item.id !== id);
    return ObjRecord.of(without);
  }
}

type ConversationMessagesStore = Record<
  string,
  Loadable<TAgentApi.ConversationEvent[]>
>;

export const ConversationEvents = atom<ConversationMessagesStore>({
  key: "AgentApiEvents",
  default: {},
});

type PartialResultsStore = TAgentApi.ConversationMetadataState;

export const ConversationPartialResults = atom<PartialResultsStore>({
  key: "AgentApiConversationPartialResults",
  default: {
    partialMessage: "",
    responding: false,
  },
});

type ConversationStore = Loadable<ObjRecord<TAgentApi.Conversation>>;

export const Conversations = atom<ConversationStore>({
  key: "AgentApiConversations",
  default: Loadable.unloaded(),
});

type AgentStore = Loadable<ObjRecord<TAgentApi.Agent>>;

export const Agents = atom<AgentStore>({
  key: "AgentApiAgents",
  default: Loadable.unloaded(),
});


type LLmStore = Loadable<ObjRecord<TAgentApi.LLm>>;

export const LLms = atom<LLmStore>({
  key: "AgentApiLLms",
  default: Loadable.unloaded(),
});

type LLm = TAgentApi.LLm | null;

export const selectedLlmState = atom<LLm>({
  key: "selectedLlmState",
  default: null,
});

export const selectedAgentState = atom<TAgentApi.Agent | null>({
  key: "selectedAgentState",
  default: null,
});

interface ActiveConversationsState {
  [agentId: string]: string;
}

export const activeConversationsState = atom<ActiveConversationsState>({
  key: "activeConversationsState",
  default: {},
});


type KnowledgeBaseStore = Loadable<TAgentApi.KnowledgeBase[]>;

export const KnowledgeBases = atom<KnowledgeBaseStore>({
  key: "KnowledgeBases",
  default: Loadable.unloaded(),
});



export const variablesState = atom({
  key: 'variablesState',
  default: [
    {
      name: "Telecommunications Company",
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
      name: "UseCases",
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
  ],
});