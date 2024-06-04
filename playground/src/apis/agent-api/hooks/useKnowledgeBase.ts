import { useRecoilState } from "recoil";
import { useEffect } from "react";
import { Loadable, KnowledgeBases } from "../state";
import * as TAgentApi from "../types";
import { InvokeAgentCloudFunction } from "../../invokeCF";
import { KnowledgeBaseURL } from "../../../endpoints";

export class CloudFunctionInvocation<T> {
    constructor(public body: any,  public endpoint: string) { }

    invoke() {
        return InvokeAgentCloudFunction<T>(this.body, this.endpoint);
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
                const invocation = new CloudFunctionInvocation<TAgentApi.KnowledgeBase[]>({
                    "Access-Control-Allow-Headers": 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
                    "Access-Control-Allow-Methods": "*",
                    "Access-Control-Allow-Origin": "*"
                }, KnowledgeBaseURL);
                const result = await invocation.invoke();
                setKnowledgeBases(Loadable.loaded(result));
            } catch (error) {
                console.error("Failed to fetch knowledge bases", error);
                setKnowledgeBases(Loadable.unloaded());
            }
        };

        fetchKnowledgeBases();
    }, [knowledgeBases, setKnowledgeBases]);

    return knowledgeBases;
}
