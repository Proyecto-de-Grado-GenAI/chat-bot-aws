import { Iteration, systemElement } from "../types";
import { useSetRecoilState } from "recoil";
import { GraphqlQuery } from "../../invoker";
import { Iterations, Loadable } from "../state";

export interface UpdateIterationResponse {
  updateIteration: Iteration;
}

export interface UpdateIterationArgs {
  id: string;
  objetive: string;
  number: number;
  name: string;
  systemElements: systemElement[];
}

const updateIterationQuery = new GraphqlQuery<UpdateIterationResponse>(`
  mutation UpdateIteration($id: ID!, $objetive: String!, $number: Int!, $name: String!, $systemElements: [systemElementInput]) {
    updateIteration(id: $id, config: {
      objetive: $objetive,
      number: $number,
      name: $name
      systemElements: $systemElements
    }) {
      id
      objetive
      number
      name
      systemElements {
        name
        description
      }
    }
  }
`);

export function useIterationApiUpdateIteration() {
  const setIterationsValue = useSetRecoilState(Iterations);

  return (request: UpdateIterationArgs) => {
    console.log(request);
    return updateIterationQuery
      .invoke(request)
      .then(() => setIterationsValue(Loadable.unloaded()))
      .catch((error) => {
        console.error("Failed to update iteration:", error);
      });
  };
}
