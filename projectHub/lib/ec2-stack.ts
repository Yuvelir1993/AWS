import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as fs from "fs";
import { MyStackProps } from "./data-model";
import { Commons } from "./commons";

export class EC2InstanceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: MyStackProps) {
    super(scope, id, props);

    const vpc = new ec2.Vpc(this, "VPC", {
      maxAzs: 2,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: "public-subnet",
          subnetType: ec2.SubnetType.PUBLIC,
        },
      ],
    });

    const securityGroup = new ec2.SecurityGroup(this, "SecurityGroup", {
      vpc,
      description: "Allow access to EC2 instances.",
      allowAllOutbound: true,
    });

    securityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      "Allow HTTP traffic"
    );
    securityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(22),
      "Allow SSH access from the world"
    );

    const keyPair = new ec2.KeyPair(this, "KeyPair", {
      type: ec2.KeyPairType.ED25519,
      format: ec2.KeyPairFormat.PEM,
    });

    const instance = new ec2.Instance(this, "EC2Instance", {
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T2,
        ec2.InstanceSize.MICRO
      ),
      machineImage: ec2.MachineImage.genericLinux({
        "eu-central-1": "ami-066902f7df67250f8", // Ubuntu Jammy 22.04 AMI
      }),
      vpc,
      keyPair: keyPair,
      securityGroup,
      role: props.ec2InstanceRole!,
    });

    new cdk.CfnOutput(this, "EC2InstancePublicIp", {
      value: instance.instancePublicIp,
      description: "Public IP of the EC2 instance hosting the website",
    });
    new cdk.CfnOutput(this, "EC2InstanceId", {
      value: instance.instanceId,
      description: "Instance ID",
    });
  }
}
