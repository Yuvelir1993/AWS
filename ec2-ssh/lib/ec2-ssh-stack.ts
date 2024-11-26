import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as ec2 from "aws-cdk-lib/aws-ec2";

export class Ec2SshStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
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

    const mySecurityGroup = new ec2.SecurityGroup(this, "SecurityGroup", {
      vpc,
      description: "Allow ssh access to EC2 instances.",
      allowAllOutbound: true,
    });
    mySecurityGroup.addIngressRule(
      // Can I retrieve here my ip?
      ec2.Peer.anyIpv4(),
      ec2.Port.SSH,
      "Allow SSH access from the world"
    );

    mySecurityGroup.addIngressRule(
      // Can I retrieve here my ip?
      ec2.Peer.anyIpv4(),
      ec2.Port.HTTP,
      "Allow HTTP access from the world"
    );

    mySecurityGroup.addIngressRule(
      // Can I retrieve here my ip?
      ec2.Peer.anyIpv4(),
      ec2.Port.HTTPS,
      "Allow HTTPS access from the world"
    );

    const keyPair = new ec2.KeyPair(this, "KeyPair", {
      type: ec2.KeyPairType.ED25519,
      format: ec2.KeyPairFormat.PEM,
    });
    const instance = new ec2.Instance(this, "EC2-SSH", {
      vpc: vpc,
      securityGroup: mySecurityGroup,
      associatePublicIpAddress: true,
      keyPair: keyPair,
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T2,
        ec2.InstanceSize.MICRO
      ),
      machineImage: new ec2.AmazonLinuxImage({
        generation: ec2.AmazonLinuxGeneration.AMAZON_LINUX_2,
      }),
    });

    new cdk.CfnOutput(this, "InstanceId", {
      value: instance.instanceId,
    });
  }
}
