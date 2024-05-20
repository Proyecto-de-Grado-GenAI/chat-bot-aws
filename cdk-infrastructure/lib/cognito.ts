import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import { CognitoAuthRole } from './cognito-auth-role';
import { PolicyStatement, Effect } from "aws-cdk-lib/aws-iam";

export function buildCognitoAuth(scope: Construct, bucketArn: string) {

    const userPool = new cognito.UserPool(scope, 'auth-user-pool', {
        userPoolName: 'appsync-playground-demo-user-pool',
        signInAliases: { email: true, },
        selfSignUpEnabled: true,
        autoVerify: { email: true },
        userVerification: {
            emailSubject: 'You need to verify your email for the playground',
            emailBody: 'Thanks for signing up Your verification code is {####}',
            emailStyle: cognito.VerificationEmailStyle.CODE,
        },
        passwordPolicy: {
            minLength: 8
        },
        accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const userClient = userPool.addClient('auth-app-client', {
        userPoolClientName: 'appsync-playground-demo-client',
        authFlows: {
            userPassword: true,
            userSrp: true,
        },
    });

    const identityPool = new cognito.CfnIdentityPool(scope, "auth-identity-pool", {
        allowUnauthenticatedIdentities: false,
        cognitoIdentityProviders: [
            {
                clientId: userClient.userPoolClientId,
                providerName: userPool.userPoolProviderName,
            },
        ],
    });

    const authenticatedRole = CognitoAuthRole(scope, identityPool)

    authenticatedRole.addToPolicy(
        // IAM policy granting users permission to a specific folder in the S3 bucket
        new PolicyStatement({
          actions: ["s3:*"],
          effect: Effect.ALLOW,
          resources: [
            bucketArn + "/private/${cognito-identity.amazonaws.com:sub}/*",
          ],
        })
      );

    new cdk.CfnOutput(scope, 'cognito-pool', {
        exportName: 'cognito-pool',
        value: userPool.userPoolId
    })

    new cdk.CfnOutput(scope, 'cognito-client', {
        exportName: 'cognito-client',
        value: userClient.userPoolClientId
    })

    new cdk.CfnOutput(scope, "identity-pool", {
        exportName: "identity-pool",
        value: identityPool.ref,
    });

    new cdk.CfnOutput(scope, "Authenticated-role-name", {
        exportName: "Authenticated-role-name",
        value: authenticatedRole.roleName,
    });


    return userPool
}