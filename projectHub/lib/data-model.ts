import * as cdk from "aws-cdk-lib";
import * as iam from "aws-cdk-lib/aws-iam";
import * as ec2 from "aws-cdk-lib/aws-ec2";

export interface MyStackProps extends cdk.StackProps {
  targetEnv: String;
  targetEnvConfig: any;
  ec2Instance: ec2.Instance | null;
  ec2InstanceRole: iam.IRole | null;
}
