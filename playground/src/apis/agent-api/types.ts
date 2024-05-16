export interface ConversationEvent {
    id: string;
    timestamp: string;
    conversationId: string;
    sender: string;
    event: EventMessage;
    disableTyping: boolean;
}

export interface EventMessage {
    message?: string;
    innerDialog?: string;
    actionRequested?: string;
    actionResult?: string;
}

export interface Conversation {
    id: string;
    timestamp: string;
    agent: string;
    events: ConversationEvent[];
}

export interface Agent {
    id: string;
    name: string;
    timestamp: string;
    handlerLambda: string;
    systemPrompt: string;
    inputMaxToken: number;
    precedence: number;
    modelParams: ModelParams;
    knowledgeBaseParams: KnowledgeBaseParams;
}

export interface ModelParams {
    temperature: number;
    top_p: number;
    max_gen_len: number;
}

export interface KnowledgeBaseParams {
    knowledgeBaseId: string;
    useKnowledgeBase: boolean;
    numberOfResults: number;
}

export interface LLm {
    id: string;
    name: string;
    model: string;
}

export interface ConversationMetadata {
    conversationId: string;
    agentStartResponding?: boolean;
    agentStopResponding?: boolean;
    agentPartialMessage?: string;
}

export interface ConversationMetadataState {
    partialMessage: string;
    responding: boolean;
}

export interface ModelParamsInput {
    temperature: number;
    top_p: number;
    max_gen_len: number;
}

export interface KnowledgeBaseParamsInput {
    knowledgeBaseId: string;
    useKnowledgeBase: boolean;
    numberOfResults: number;
}

export interface NewAgent {
    name: string;
    handlerLambda: string;
    systemPrompt: string;
    inputMaxToken: number;
    precedence: number;
    modelParams: ModelParamsInput;
    knowledgeBaseParams: KnowledgeBaseParamsInput;
}

export interface UpdateAgentInput {
    name?: string;
    handlerLambda?: string;
    systemPrompt?: string;
    inputMaxToken?: number;
    precedence?: number;
    modelParams?: ModelParamsInput;
    knowledgeBaseParams?: KnowledgeBaseParamsInput;
}

export interface KnowledgeBase {
    status: string;
    name: string;
    description: string;
    updatedAt : string;
    knowledgeBaseId: string;
}