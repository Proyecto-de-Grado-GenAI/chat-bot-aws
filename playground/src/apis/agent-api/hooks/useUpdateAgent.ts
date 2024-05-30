import { Agent, AgentPhase } from "../types";
import { useSetRecoilState } from "recoil";
import { GraphqlQuery } from "../../invoker";
import { Agents, Loadable } from "../state";

export interface UpdateAgentResponse {
    updateAgent: Agent;
  }
  
  export interface UpdateAgentArgs {
    id: string;
    name: string;
    systemPrompt: string;
    handlerLambda: string;
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
    phases: AgentPhase[];
  }
  
  const updateAgentQuery = new GraphqlQuery<UpdateAgentResponse>(`
    mutation UpdateAgent($id: ID!, $name: String!, $systemPrompt: String!, $handlerLambda: String!, $inputMaxToken: Int!, $precedence: Int!, $modelParams: ModelParamsInput!, $knowledgeBaseParams: KnowledgeBaseParamsInput!, $phases: [AgentPhaseInput!]!) {
      updateAgent(id: $id, config: {
        name: $name,
        systemPrompt: $systemPrompt,
        handlerLambda: $handlerLambda,
        inputMaxToken: $inputMaxToken,
        precedence: $precedence,
        modelParams: $modelParams,
        knowledgeBaseParams: $knowledgeBaseParams,
        phases: $phases
      }) {
        id
        name
        systemPrompt
        handlerLambda
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
          instruccion
        }
      }
    }
  `);
export function useAgentApiUpdateAgent() {
  const setAgentsValue = useSetRecoilState(Agents);

  return (request: UpdateAgentArgs) => {
    console.log(request);
    return updateAgentQuery
      .invoke(request)
      .then(() => setAgentsValue(Loadable.unloaded()))
      .catch((error) => {
        console.error("Failed to update agent:", error);
      });
  };
}
