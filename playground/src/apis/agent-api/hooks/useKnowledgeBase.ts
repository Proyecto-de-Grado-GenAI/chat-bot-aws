import { useRecoilState } from "recoil";
import { useEffect } from "react";
import { Loadable, ObjRecord, KnowledgeBases } from "../state";
import * as TAgentApi from "../types";
import { invokeAgentCloudFunction } from "../../invokeCF";




export class CloudFunctionInvocation<T> {
    constructor(
        public body: any,
        public label: string
    ) { }

    invoke() {
        return invokeAgentCloudFunction<T>(this.body, this.label);
    }   
}

export function useKnowledgeBase() {
    const [knowledgeBases, setKnowledgeBases] = useRecoilState(KnowledgeBases);

    useEffect(() => {
        if (!knowledgeBases.isUnloaded()) {
            return;
        }

        setKnowledgeBases(Loadable.loading());

        const fetchKnowledgeBases = async () => {
            try {
                const invocation = new CloudFunctionInvocation<{ listKnowledgeBases: TAgentApi.KnowledgeBase[] }>({}, 'test');
                const result = await invocation.invoke();
                setKnowledgeBases(
                    Loadable.loaded(
                        ObjRecord.of(result.listKnowledgeBases)
                    )
                );
            } catch (error) {
            }
        };

        fetchKnowledgeBases();
    }, [knowledgeBases, setKnowledgeBases]);

    return knowledgeBases;
}
