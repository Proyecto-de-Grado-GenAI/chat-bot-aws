import { Agent, AgentPhase } from "../types";
import { useSetRecoilState } from "recoil";
import { GraphqlQuery } from "../../invoker";
import { Agents, Loadable } from "../state";

export interface CreateAgentResponse {
    createAgent: Agent
}

export interface CreateAgentArgs {
    name: string
    systemPrompt: string
    handlerLambda: string
    inputMaxToken: number
    precedence: number
    modelParams: {
        temperature: number
        top_p: number
        max_gen_len: number
    }
    knowledgeBaseParams: {
        knowledgeBaseId: string
        useKnowledgeBase: boolean
        numberOfResults: number
    }
    phases: AgentPhase[]
}

const createAgentQuery = new GraphqlQuery<CreateAgentResponse>(`
    mutation CreateAgent($handlerLambda: String!, $systemPrompt: String!, $name: String!, $inputMaxToken: Int!, $precedence: Int!, $modelParams: ModelParamsInput!, $knowledgeBaseParams: KnowledgeBaseParamsInput!, $phases: [AgentPhaseInput!]!) {
        createAgent(config: {
            name: $name, 
            handlerLambda: $handlerLambda, 
            systemPrompt: $systemPrompt, 
            inputMaxToken: $inputMaxToken, 
            precedence: $precedence,
            modelParams: $modelParams,
            knowledgeBaseParams: $knowledgeBaseParams,
            phases: $phases
        }) {
            id
            name
            handlerLambda
            systemPrompt
            inputMaxToken
            precedence
            modelParams {
                temperature
                top_p
                max_gen_len
            }
            knowledgeBaseParams {
                knowledgeBaseId
                useKnowledgeBase
                numberOfResults
            }
            phases {
                name
                description
            }
        }
    }
`)


export function useAgentApiCreateAgent () {

    const setAgentsValue = useSetRecoilState(Agents)

    return (request: CreateAgentArgs) => {
        console.log(request)
        createAgentQuery.invoke(request)
            .then((result) => 
                setAgentsValue(Loadable.unloaded()))
    }
}
