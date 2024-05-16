import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as path from 'path';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import { Duration } from 'aws-cdk-lib';
import { Construct } from 'constructs';

interface BuildCustomLambdaProps {
    lambdaPath: string,
    userPool: cognito.UserPool,
}

export function buildCustomLambda(scope: Construct, props: BuildCustomLambdaProps) {
    const role = new iam.Role(scope, 'AgentLambdaFunction-execution-role-' + props.lambdaPath, {
        assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
        managedPolicies: [
            iam.ManagedPolicy.fromAwsManagedPolicyName("service-role/AWSLambdaBasicExecutionRole"),
        ],
        inlinePolicies: {
            bedrockAccessPolicy: new iam.PolicyDocument({
                statements: [
                    new iam.PolicyStatement({
                        actions: [
                            'bedrock:InvokeModel',
                            'bedrock:InvokeModelWithResponseStream',
                            'bedrock:Retrieve',
                            'bedrock:ListKnowledgeBases',
                        ],
                        resources: ['*']
                    })
                ]
            })
        }
    });

    // Build function with docker
    const lambdaFunction = new lambda.DockerImageFunction(scope, "CustomLambda-" + props.lambdaPath, {
        functionName: "AppsyncAgentFunction-" + props.lambdaPath,
        code: lambda.DockerImageCode.fromImageAsset(
            path.join(__dirname, "../../" + props.lambdaPath)
        ),
        timeout: Duration.minutes(5),
        memorySize: 1024,
        role
    });

    // Create API Gateway REST API
    const api = new apigateway.RestApi(scope, 'AgentApiGateway', {
        restApiName: 'Agent Service',
        description: 'This service serves agent requests.',
        defaultCorsPreflightOptions: {
            allowOrigins: apigateway.Cors.ALL_ORIGINS,
            allowMethods: apigateway.Cors.ALL_METHODS,
        },
    });

    // Create Cognito authorizer
    const authorizer = new apigateway.CognitoUserPoolsAuthorizer(scope, 'AgentApiAuthorizer', {
        cognitoUserPools: [props.userPool]
    });

    const postIntegration = new apigateway.LambdaIntegration(lambdaFunction, {
        requestTemplates: { "application/json": '{ "statusCode": "200" }' },
        integrationResponses: [{
            statusCode: '200',
            responseParameters: {
                'method.response.header.Access-Control-Allow-Origin': "'*'",
                'method.response.header.Access-Control-Allow-Headers': "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'",
                'method.response.header.Access-Control-Allow-Methods': "'OPTIONS,POST'",
            },
        }],
    });

    const postMethodOptions: apigateway.MethodOptions = {
        authorizer: authorizer,
        authorizationType: apigateway.AuthorizationType.COGNITO,
        methodResponses: [{
            statusCode: '200',
            responseParameters: {
                'method.response.header.Access-Control-Allow-Origin': true,
                'method.response.header.Access-Control-Allow-Headers': true,
                'method.response.header.Access-Control-Allow-Methods': true,
            },
        }],
    };

    api.root.addMethod('POST', postIntegration, postMethodOptions);

    // Output the API URL
    new cdk.CfnOutput(scope, 'AgentApiUrl', { value: api.url });

    // Build exports
    new cdk.CfnOutput(scope, props.lambdaPath, { exportName: props.lambdaPath, value: lambdaFunction.functionName });

    return lambdaFunction;
}
