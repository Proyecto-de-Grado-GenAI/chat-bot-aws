import { Auth } from "aws-amplify";
import { agentApiEndpoint } from "../endpoints";

export async function Invoke<T> (query: string, variables: any, endpoint: string, authHeaders: any) {
    console.log(JSON.stringify({
                query,
                variables: variables || {}
            }))

    const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            ...authHeaders,
        },
        body: JSON.stringify({
            query,
            variables: variables || {}
        })
    });

    const responseBody = await response.json();

    if (responseBody.errors) {
        throw new Error(responseBody.errors[0].message);
    }

    return responseBody.data as T;
}

export async function InvokeAgentAPI<T> (query: string, variables?: any) { 
    console.log('Invoking agent', query, variables)
    console.log('Invoking agent', agentApiEndpoint)
    const user = await Auth.currentAuthenticatedUser()
    return Invoke<T>(query, variables, agentApiEndpoint, {
        Authorization: user.signInUserSession.accessToken.jwtToken
    });
}


export class GraphqlQuery<T> {

    constructor(
        public query: string
    ) { }

    invoke(variables : any = {}){
        return InvokeAgentAPI<T>(this.query, variables);
    }   
}

