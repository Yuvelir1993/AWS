import * as cdk from "aws-cdk-lib";
import ec2 = require("aws-cdk-lib/aws-ec2");
import ecs = require("aws-cdk-lib/aws-ecs");
import { Construct } from "constructs";

export class S3ParserStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const vpc = new ec2.Vpc(this, "S3-reader-app-VPC");

    const ecsCluster = new ecs.Cluster(this, "MyS3apiECSCluster", {
      clusterName: "S3-API-Cluster",
      vpc: vpc,
      capacity: {
        instanceType: ec2.InstanceType.of(
          ec2.InstanceClass.T3,
          ec2.InstanceSize.MICRO
        ),
      },
    });

    const taskDefinition = new ecs.Ec2TaskDefinition(this, "TaskDef", {
      family: "S3ReaderBackend",
    });

    taskDefinition.addContainer("DefaultContainer", {
      image: ecs.ContainerImage.fromAsset("../assets/s3-api/Dockerfile", {
        buildArgs: {
          API_PORT: "5000",
          // "S3_BUCKET": "XXXXXXXXXXXXXXXX"
        },
      }),
      memoryLimitMiB: 512,
    });

    const ecsService = new ecs.Ec2Service(this, "S3ReaderBackendService", {
      cluster: ecsCluster,
      taskDefinition,
    });
  }
}
