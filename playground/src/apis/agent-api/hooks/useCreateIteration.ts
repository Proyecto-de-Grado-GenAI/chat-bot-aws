import { useSetRecoilState } from "recoil";
import { GraphqlQuery } from "../../invoker";
import { Iterations, Loadable } from "../state";

interface CreateIterationResponse {
    createIteration: {
        id: string
    }
}

interface CreateIterationArgs {
    objetive: string
    number: number
    name: string
}

const createIterationQuery = new GraphqlQuery<CreateIterationResponse>(`
    mutation CreateIteration($objetive: String!, $number: Int!, $name: String!) {
        createIteration(config: {
            objetive: $objetive,
            number: $number,
            name: $name
        }) {
            id
        }
    }
`);

export function useAgentApiCreateIteration() {

    const setIterationsValue = useSetRecoilState(Iterations);

    return (request: CreateIterationArgs) => {
        return createIterationQuery.invoke(request)
            .then((result) => {
                setIterationsValue(Loadable.unloaded());
                console.log('Created iteration', result);
                return result;
            });
    }
}
