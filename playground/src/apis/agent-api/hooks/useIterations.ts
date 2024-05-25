import { useRecoilState } from "recoil"
import { GraphqlQuery } from "../../invoker"
import { useEffect } from "react"
import { Iterations, Loadable, ObjRecord } from "../state"
import { Iteration } from "../types"



// Definición de la consulta GraphQL para obtener Iterations
interface GetIterationResponse {
    listIterations: Iteration[]
}

const listIterationsQuery = new GraphqlQuery<GetIterationResponse>(`
    query {
        listIterations {
            id
            objetive
            number
        }
    }
`)

// Hook para obtener la lista de Iterations
export function useIterationApiIterationList() {

    const [iterationsState, setIterationsState] = useRecoilState(Iterations)

    useEffect(() => {
        if (!iterationsState.isUnloaded()) {
            return
        }

        setIterationsState(Loadable.loading())

        listIterationsQuery.invoke()
            .then((result) => {
                setIterationsState(
                    Loadable.loaded(
                        ObjRecord.of(result.listIterations)
                    )
                )
            })
    }, [iterationsState, setIterationsState])

    return iterationsState
}

// Hook para obtener una Iteration específica por ID
export function useIterationApiIteration(id: string = ''): Loadable<Iteration> {

    const iterations = useIterationApiIterationList()

    if (iterations.isUnloaded() || !iterations.value) {
        return Loadable.loading()
    }

    return Loadable.loaded(iterations.value.get(id))
}