#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { DataProcessingStack } from "../lib/data-processing-stack";

const app = new cdk.App();
const targetEnv = app.node.tryGetContext("targetEnv");
if (!targetEnv) {
  throw new Error(
    "Environment not specified! Use '-c targetEnv=blue' or '-c targetEnv=green'"
  );
}
const targetEnvConfig = app.node.tryGetContext("environment")[targetEnv];
if (!targetEnvConfig) {
  throw new Error(
    `Environment configuration for '${targetEnv}' not found in cdk.json`
  );
}

new DataProcessingStack(app, `ProjectHubStack-${targetEnv}`, {
  targetEnv,
  targetEnvConfig,
});
