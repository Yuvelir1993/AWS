import * as cdk from "aws-cdk-lib";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import { Construct } from "constructs";
import { MyEnvProps, MyVpcProps } from "./data-model";
import path = require("path");

export class NetworkStack extends cdk.Stack {
  public readonly myVpcProps: MyVpcProps = {} as MyVpcProps;
  constructor(scope: Construct, id: string, props: MyEnvProps) {
    super(scope, id, props);

    const vpc = new ec2.Vpc(this, `VPC-${props.targetEnv}`, {
      vpcName: `VPC-${props.targetEnv}`,
      maxAzs: 2,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: `public-subnet-${props.targetEnv}`,
          subnetType: ec2.SubnetType.PUBLIC,
        },
      ],
    });

    const vpcGatewayEndpoint = vpc.addGatewayEndpoint(
      `S3Endpoint-${props.targetEnv}`,
      {
        service: ec2.GatewayVpcEndpointAwsService.S3,
      }
    );

    const securityGroup = new ec2.SecurityGroup(
      this,
      `SecurityGroup-${props.targetEnv}`,
      {
        vpc,
        description: "Allow access to EC2 instances.",
        allowAllOutbound: true,
      }
    );

    securityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.HTTP,
      "Allow HTTP traffic"
    );
    securityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.HTTPS,
      "Allow HTTPS traffic"
    );
    securityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.SSH,
      "Allow SSH access from the world"
    );

    this.myVpcProps.vpc = vpc;
    this.myVpcProps.vpcGatewayEndpoint = vpcGatewayEndpoint;
    this.myVpcProps.securityGroup = securityGroup;
  }
}
