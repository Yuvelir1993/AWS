import * as cdk from 'aws-cdk-lib';
import ec2 = require("aws-cdk-lib/aws-ec2");
import ecs = require("aws-cdk-lib/aws-ecs");
import * as elbv2 from "aws-cdk-lib/aws-elasticloadbalancingv2";
import { Construct } from 'constructs';
import path = require('path');

const config = {
  apiPort: 5001,
  hostPort: 5001,
  loadBalancerPort: 80,
  webAppBackendName: "WebAppBackend"
};

export class S3ParserStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const vpc = this.createVpc();
    const ecsCluster = this.createEcsCluster(vpc);
    const taskDefinitionBackendAPI = this.createBackendTaskDefinition();
    const ecsFargateBackendAPIService = this.createFargateService(ecsCluster, taskDefinitionBackendAPI);

    this.createApplicationLoadBalancer(vpc, ecsFargateBackendAPIService);
  }

  private createVpc (): ec2.Vpc {
    return new ec2.Vpc(this, "WebAppVPC", { maxAzs: 2 });
  }

  private createEcsCluster (vpc: ec2.Vpc): ecs.Cluster {
    return new ecs.Cluster(this, "WebAppECSCluster", {
      clusterName: "Web-App-Cluster",
      vpc: vpc
    });
  }

  private createBackendTaskDefinition (): ecs.FargateTaskDefinition {
    const taskDefinition = new ecs.FargateTaskDefinition(this, `${config.webAppBackendName}TaskDef`, {
      family: `${config.webAppBackendName}Family`,
      cpu: 256,
      memoryLimitMiB: 512
    });

    taskDefinition.addContainer(`${config.webAppBackendName}APIContainer`, {
      image: ecs.ContainerImage.fromAsset(path.resolve(__dirname, '../assets/s3-api'), {
        buildArgs: {
          API_PORT: `${config.apiPort}`
        },
      }),
      portMappings: [{ containerPort: config.apiPort, hostPort: config.hostPort }]
    });

    return taskDefinition;
  }

  private createFargateService (cluster: ecs.Cluster, taskDefinition: ecs.FargateTaskDefinition): ecs.FargateService {
    const service = new ecs.FargateService(this, `${config.webAppBackendName}ApiService`, {
      cluster: cluster,
      taskDefinition: taskDefinition,
    });

    service.autoScaleTaskCount({ maxCapacity: 2 });
    return service;
  }

  private createApplicationLoadBalancer (vpc: ec2.Vpc, ecsService: ecs.FargateService): void {
    const loadBalancer = new elbv2.ApplicationLoadBalancer(
      this,
      `${config.webAppBackendName}APIService-internal-elbv2`,
      {
        vpc,
        internetFacing: true,
      }
    );

    const listener = loadBalancer.addListener(
      `${config.webAppBackendName}APIService-http-api-listener`,
      {
        port: config.loadBalancerPort,
        open: true,
        defaultAction: elbv2.ListenerAction.fixedResponse(404),
      }
    );

    listener.addTargets(
      `${config.webAppBackendName}APIService-target-group`,
      {
        port: config.loadBalancerPort,
        healthCheck: {
          path: "/health",
          interval: cdk.Duration.seconds(30),
          timeout: cdk.Duration.seconds(3),
        },
        targets: [ecsService]
      }
    );

    new cdk.CfnOutput(this, "LoadBalancerDNS", {
      value: loadBalancer.loadBalancerDnsName,
    });
  }
}
