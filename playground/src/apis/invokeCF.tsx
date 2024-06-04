import { fetchAuthSession } from 'aws-amplify/auth';
import axios from "axios";

// Función para invocar una función en la nube con autenticación
export async function invokeCloudFunction<T>(body: any, endpoint: string, authHeaders: any): Promise<T> {

    try {
        const response = await axios.post(endpoint, body, {
            headers: {
                'Content-Type' : 'application/x-www-form-urlencoded; charset=UTF-8',
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

export async function getIdToken() {
    try {
      const idToken = (await fetchAuthSession()).tokens?.idToken?.toString() ?? {};
      return idToken
    } catch (err) {
      console.log(err);
    }
  }

export async function InvokeAgentCloudFunction<T>(body: any, endpoint: string): Promise<T> {
    try {
        const idToken = await getIdToken();
        console.log("xd", idToken)
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
