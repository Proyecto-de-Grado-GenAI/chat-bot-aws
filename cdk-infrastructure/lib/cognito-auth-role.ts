import { Construct } from 'constructs';
import { Role, FederatedPrincipal, PolicyStatement, Effect } from "aws-cdk-lib/aws-iam";
import { CfnIdentityPool, CfnIdentityPoolRoleAttachment } from 'aws-cdk-lib/aws-cognito';


export function CognitoAuthRole(scope: Construct, identityPool: CfnIdentityPool) {

    const role = new Role(scope, "CognitoDefaultAuthenticatedRole", {
        assumedBy: new FederatedPrincipal(
            "cognito-identity.amazonaws.com",
            {
                StringEquals: {
                    "cognito-identity.amazonaws.com:aud": identityPool.ref,
                },
                "ForAnyValue:StringLike": {
                    "cognito-identity.amazonaws.com:amr": "authenticated",
                },
            },
            "sts:AssumeRoleWithWebIdentity"
        ),
    });
    role.addToPolicy(
        new PolicyStatement({
            effect: Effect.ALLOW,
            actions: [
                "mobileanalytics:PutEvents",
                "cognito-sync:*",
                "cognito-identity:*",
            ],
            resources: ["*"],
        })
    );

    new CfnIdentityPoolRoleAttachment(scope, "IdentityPoolRoleAttachment", {
        identityPoolId: identityPool.ref,
        roles: { authenticated: role.roleArn },
    }
    );
    return role
}