#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { DataProcessingStack } from "../lib/data-processing-stack";
import { EC2InstanceStack } from "../lib/ec2-stack";
import { IamRoleStack as SecurityStack } from "../lib/security-stack";
import { CdkGraph, FilterPreset } from "@aws/pdk/cdk-graph";
import {
  CdkGraphDiagramPlugin,
  DiagramFormat,
} from "@aws/pdk/cdk-graph-plugin-diagram";

(async () => {
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

  const securityStack = new SecurityStack(app, `SecurityStack-${targetEnv}`, {
    targetEnv,
  });

  new DataProcessingStack(app, `ProjectHubStack-${targetEnv}`, {
    targetEnv,
    targetEnvConfig,
    ec2InstanceRole: securityStack.ec2InstanceRole,
  });

  new EC2InstanceStack(app, `ProjectHubEC2Stack-${targetEnv}`, {
    targetEnv,
    targetEnvConfig,
    ec2InstanceRole: securityStack.ec2InstanceRole,
  });

  // https://aws.github.io/aws-pdk/developer_guides/cdk-graph-plugin-diagram/index.html
  const graph = new CdkGraph(app, {
    plugins: [
      new CdkGraphDiagramPlugin({
        diagrams: [
          {
            format: DiagramFormat.PNG,
            name: "diagram-1-png",
            title: "Diagram 1 (dark + compact)",
            theme: "dark",
          },
          {
            name: "diagram-2",
            title: "Diagram 2 (dark + verbose)",
            theme: "dark",
            filterPlan: {
              preset: FilterPreset.NONE,
            },
          },
          {
            name: "diagram-3",
            title: "Diagram 3 (no defaults)",
            ignoreDefaults: true,
          },
        ],
      }),
    ],
  });

  app.synth();

  await graph.report();
})();
