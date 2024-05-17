import { Auth } from "aws-amplify";
import axios from "axios";

// Función para invocar una función en la nube con autenticación
export async function invokeCloudFunction<T>(body: any, endpoint: string, authHeaders: any): Promise<T> {

    try {
        const response = await axios.post(endpoint, body, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authHeaders.Authorization}`,
            },
        });
        const responseBody = response.data;
        if (responseBody.errors) {
            throw new Error(responseBody.errors[0].message);
        }
        return responseBody as T;
    } catch (error) {
        if (axios.isAxiosError(error)) {
            const errorMessage = `HTTP error! status: ${error.response?.status}, message: ${error.message}`;
            console.error(errorMessage);
            throw new Error(errorMessage);
        } else {
            console.error('Unexpected error:', error);
            throw error;
        }
    }
}

export async function InvokeAgentCloudFunction<T>(body: any, endpoint: string): Promise<T> {
    try {
        const currentSession = await Auth.currentSession();
        const idToken = currentSession.getIdToken().getJwtToken();

        const result = await invokeCloudFunction<T>(body, endpoint, {
            Authorization: idToken, // Pasando el token dinámico
        });

        return result;
    } catch (error) {
        console.error('Error invoking cloud function:', error);
        throw error;
    }
}

export class CloudFunctionInvocation<T> {
    constructor(
        public body: any,
        public endpoint: string
    ) { }

    invoke() {
        return InvokeAgentCloudFunction<T>(this.body, this.endpoint);
    }   
}
