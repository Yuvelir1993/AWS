#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
// import { AppMicroservicesStack } from "../lib/app-microservices-stack";
import { DataProcessingStack } from "../lib/data-processing-stack";

const app = new cdk.App();
new DataProcessingStack(app, "S3StorageStack", {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
});
// new AppMicroservicesStack(app, "S3ParserStack", {
//   /* For more information, see https://docs.aws.amazon.com/cdk/latest/guide/environments.html */
//   env: {
//     account: process.env.CDK_DEFAULT_ACCOUNT,
//     region: process.env.CDK_DEFAULT_REGION,
//   },
// });
