import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Bucket, } from "aws-cdk-lib/aws-s3";
import { aws_s3 as s3 } from 'aws-cdk-lib';

export function S3ComprehensionBucket(scope: Construct) {
    const bucket = new s3.Bucket(scope, "chat-bot-comprehension-bucket", {
        bucketName: "chat-bot-comprehension-bucket",
        cors: [
            {
                allowedHeaders: ["*"],
                allowedMethods: [s3.HttpMethods.GET, s3.HttpMethods.PUT, s3.HttpMethods.POST, s3.HttpMethods.DELETE, s3.HttpMethods.HEAD],
                allowedOrigins: ["*"],
                maxAge: 3000,
            },
        ],
    });

    // Export values
    new cdk.CfnOutput(scope, "attachments-bucket-name", {
        exportName: "attachments-bucket-name",
        value: bucket.bucketName,
    });

    return bucket
}