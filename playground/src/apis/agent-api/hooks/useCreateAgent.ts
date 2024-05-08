import { Agent } from "../types";
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
    actions: string[]
    inputMaxToken: number
    precedence: number
}

const createAgentQuery = new GraphqlQuery<CreateAgentResponse>(`
    mutation CreateAgent($handlerLambda: String!, $systemPrompt: String!, $name: String!, $actions: [String!]!, $inputMaxToken: Int!, $precedence: Int!){
        createAgent(config: {name: $name, handlerLambda: $handlerLambda, systemPrompt: $systemPrompt, actions: $actions , inputMaxToken: $inputMaxToken, precedence: $precedence}) {
            id
            name
            handlerLambda
            systemPrompt
            inputMaxToken
            precedence
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
