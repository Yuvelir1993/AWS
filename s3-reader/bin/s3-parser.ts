#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { S3ParserStack } from "../lib/s3-parser-stack";

const app = new cdk.App();
new S3ParserStack(app, "S3ParserStack", {
  /* For more information, see https://docs.aws.amazon.com/cdk/latest/guide/environments.html */
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
});
