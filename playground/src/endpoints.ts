export const agentApiEndpoint = process.env.REACT_APP_AGENTAPIENDPOINT as string

export const cognitoConfig = {
	region: process.env.REACT_APP_REGION as string,
	userPoolId: process.env.REACT_APP_COGNITOPOOL as string,
	userPoolWebClientId: process.env.REACT_APP_COGNITOCLIENT as string,
}

export const fmHandlerArns = [

	{
		label: 'Exploration Lambda Handler',
		name: process.env.REACT_APP_EXPLORATIONLAMBDAHANDLER,
	},
	{
		label: 'Diagram Lambda Handler',
		name: process.env.REACT_APP_DIAGRAMLAMBDAHANDLER,
	},
]

export const etapas = process.env.REACT_APP_ETAPAS


export const appsyncActionOutputs = [
	{
		label: 'car-dealership',
		endpoint: process.env.REACT_APP_CARDEALERAPI,
	},
]

export const enableConfigureAgents = process.env.REACT_APP_ENABLECONSTRUCTINGAGENTS === 'true'