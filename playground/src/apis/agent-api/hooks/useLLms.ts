import { useRecoilState } from "recoil"
import { GraphqlQuery } from "../../invoker"
import { LLm } from "../types"
import { useEffect } from "react"
import { LLms, Loadable, ObjRecord } from "../state"

interface GetLLmResponse {
    listLLms: LLm[]
}

const listLLmsQuery = new GraphqlQuery<GetLLmResponse>(`
    query {
        listLLms {
            id
            name
            model
        }
    }
`)

export function useLLmList () {

    const [llmsState, setLLmsState] = useRecoilState(LLms)

    useEffect(() => {
        if (!llmsState.isUnloaded()) {
            return
        }

        setLLmsState(Loadable.loading())

        listLLmsQuery.invoke()
            .then((result) => {
                setLLmsState(
                    Loadable.loaded(
                        ObjRecord.of( result.listLLms )
                    )
                )
            })
    }, [llmsState, setLLmsState])

    return llmsState
    
}