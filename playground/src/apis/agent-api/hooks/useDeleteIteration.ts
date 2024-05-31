import { useSetRecoilState } from "recoil";
import { GraphqlQuery } from "../../invoker";
import { Iterations, Loadable } from "../state";

interface DeleteIterationResponse {
    deleteIteration: {
        id: string
    }
}

const deleteIterationQuery = new GraphqlQuery<DeleteIterationResponse>(`
    mutation DeleteIteration($id: ID!) {
        deleteIteration(id: $id) {
            id
        }
    }
`)

export function useAgentApiDeleteIteration () {

    const setIterationsValue = useSetRecoilState(Iterations)

    return (id: string = '') => {
        return deleteIterationQuery.invoke({ id })
            .then(() => setIterationsValue(Loadable.unloaded()))
    }
}
