import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as path from 'path';

import { Duration } from 'aws-cdk-lib';
import { Construct } from 'constructs';

interface BuildCustomLambdaProps {
    lambdaPath: string,
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
    });

    const postIntegration = new apigateway.LambdaIntegration(lambdaFunction, {
        requestTemplates: { "application/json": '{ "statusCode": "200" }' }
    });

    api.root.addMethod('POST', postIntegration);

    // Output the API URL
    new cdk.CfnOutput(scope, 'AgentApiUrl', { value: api.url });

    // Build exports
    new cdk.CfnOutput(scope, props.lambdaPath, { exportName: props.lambdaPath, value: lambdaFunction.functionName });

    return lambdaFunction;
}
