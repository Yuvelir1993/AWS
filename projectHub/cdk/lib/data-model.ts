import * as cdk from "aws-cdk-lib";
import * as iam from "aws-cdk-lib/aws-iam";
import * as ec2 from "aws-cdk-lib/aws-ec2";

export interface MyEnvProps extends cdk.StackProps {
  targetEnv: String;
  targetEnvConfig: any;
}

export interface MyVpcProps {
  vpc: ec2.IVpc;
  vpcGatewayEndpoint: ec2.GatewayVpcEndpoint;
  securityGroup: ec2.ISecurityGroup;
}

export interface MyStackProps extends cdk.StackProps {
  myEnvProps: MyEnvProps;
  ec2InstanceRole: iam.IRole | null;
  vpcProps: MyVpcProps | null;
}