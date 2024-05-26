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
}

const createIterationQuery = new GraphqlQuery<CreateIterationResponse>(`
    mutation CreateIteration($objetive: String!, $number: Int!) {
        createIteration(config: {
            objetive: $objetive,
            number: $number
        }) {
            id
        }
    }
`);

export function useAgentApiCreateIteration() {

    const setIterationsValue = useSetRecoilState(Iterations);

    return (request: CreateIterationArgs) => {
        console.log(request);
        return createIterationQuery.invoke(request)
            .then((result) => {
                setIterationsValue(Loadable.unloaded());
                console.log('Created iteration', result);
                return result;
            });
    }
}
