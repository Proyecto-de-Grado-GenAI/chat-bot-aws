import { useSetRecoilState } from "recoil";
import { GraphqlQuery } from "../../invoker";
import { Agents, Loadable } from "../state";
import { NewAgent, UpdateAgentInput } from "../types";

interface UpdateAgentResponse {
    updateAgent: {
        id: string;
        name: string;
        handlerLambda: string;
        systemPrompt: string;
        inputMaxToken: number;
        precedence: number;
        modelParams: {
            temperature: number;
            top_p: number;
            max_gen_len: number;
        };
        knowledgeBaseParams: {
            knowledgeBaseId: string;
            useKnowledgeBase: boolean;
            numberOfResults: number;
        };
    };
}

const updateAgentQuery = new GraphqlQuery<UpdateAgentResponse>(`
    mutation UpdateAgent($id: ID!, $config: UpdateAgentInput!) { 
        updateAgent(id: $id, config: $config) {
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
        }
    }
`);


export function useAgentApiUpdateAgent() {
    const setAgentsValue = useSetRecoilState(Agents);

    return (id: string, config: UpdateAgentInput) => { // Asegúrate de que aquí uses UpdateAgentInput
        console.log("Updating agent:", id, config);
        return updateAgentQuery.invoke({ id, config })
            .then(() => setAgentsValue(Loadable.unloaded()))
            .catch((error) => {
                console.error("Failed to update agent:", error);
            });
    };
}
