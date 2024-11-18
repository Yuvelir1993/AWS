import * as cdk from "aws-cdk-lib";
import * as iam from "aws-cdk-lib/aws-iam";

export interface MyStackProps extends cdk.StackProps {
  targetEnv: String;
  targetEnvConfig: any;
  ec2InstanceRole: iam.IRole | null;
}
