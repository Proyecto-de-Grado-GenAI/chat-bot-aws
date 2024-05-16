import { Auth } from "aws-amplify";
import { getLambdaEndpoint } from "../endpoints";

export async function invokeCloudFunction<T>(body: any, endpoint: string, authHeaders: any) {
    console.log(JSON.stringify({
        body,
        endpoint,
        authHeaders
    }));

    const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            ...authHeaders,
        },
        body: JSON.stringify(body)
    });

    const responseBody = await response.json();

    if (responseBody.errors) {
        throw new Error(responseBody.errors[0].message);
    }

    return responseBody.data as T;
}

export async function invokeAgentCloudFunction<T>(body: any, label: string) { 
    console.log('Invoking cloud function with body:', body);
    const endpoint = getLambdaEndpoint(label);
    if (!endpoint) {
        throw new Error(`No endpoint found for label: ${label}`);
    }
    console.log('Cloud Function endpoint:', endpoint);
    const user = await Auth.currentAuthenticatedUser();
    return invokeCloudFunction<T>(body, endpoint, {
        Authorization: user.signInUserSession.accessToken.jwtToken
    });
}

export class CloudFunctionInvocation<T> {
    constructor(
        public body: any,
        public label: string
    ) { }

    invoke() {
        return invokeAgentCloudFunction<T>(this.body, this.label);
    }   
}
