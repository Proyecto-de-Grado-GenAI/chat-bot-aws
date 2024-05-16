import { Auth } from "aws-amplify";
import axios from "axios";

// Función para invocar una función en la nube con autenticación
export async function invokeCloudFunction<T>(body: any, endpoint: string, authHeaders: any): Promise<T> {
    console.log('Request:', JSON.stringify({ body, endpoint, authHeaders }));

    try {
        const response = await axios.post("https://l5fbhr9t4g.execute-api.us-east-1.amazonaws.com/prod");



        const responseBody = response.data;

        console.log('Response:', responseBody);

        if (responseBody.errors) {
            throw new Error(responseBody.errors[0].message);
        }

        return responseBody.data as T;
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

// Función para invocar una función de agente en la nube
export async function invokeAgentCloudFunction<T>(body: any, endpoint: string): Promise<T> {
    try {
        const user = await Auth.currentAuthenticatedUser();
        const token = user.signInUserSession.accessToken.jwtToken;  // Asegúrate de usar `jwtToken`
        console.log('Invoking agent with token:', token);

        const result = await invokeCloudFunction<T>(body, endpoint, {
            Authorization: `bearer ${token}`,
        });

        console.log('Cloud Function result:', result);
        return result;
    } catch (error) {
        console.error('Error invoking cloud function:', error);
        throw error;
    }
}

// Clase para invocar una función en la nube
export class CloudFunctionInvocation<T> {
    constructor(
        public body: any,
        public endpoint: string
    ) { }

    invoke() {
        return invokeAgentCloudFunction<T>(this.body, this.endpoint);
    }   
}
