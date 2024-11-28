import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import { MyStackProps, MyVpcProps } from "./data-model";

export class EC2InstanceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: MyStackProps) {
    super(scope, id, props);

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
      vpc: props.vpcProps?.vpc!,
      keyPair: keyPair,
      securityGroup: props.vpcProps?.securityGroup,
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
    new cdk.CfnOutput(this, `VPCGatewayEndpointS3`, {
      value: props.vpcProps?.vpcGatewayEndpoint.vpcEndpointId!,
      description: "ID of the VPC Gateway Endpoint S3",
    });
  }
}
