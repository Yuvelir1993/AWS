import * as cdk from "aws-cdk-lib";
import * as iam from "aws-cdk-lib/aws-iam";
import { Construct } from "constructs";
import { MyStackProps } from "./data-model";

export class SecurityStack extends cdk.Stack {
  public readonly ec2InstanceRole: iam.IRole;

  constructor(scope: Construct, id: string, props: MyStackProps) {
    super(scope, id, props);

    this.ec2InstanceRole = new iam.Role(
      this,
      `EC2InstanceRole-${props.targetEnv}`,
      {
        assumedBy: new iam.ServicePrincipal("ec2.amazonaws.com"),
        description: "Given to EC2 to be used for downloading objects from S3.",
      }
    );
  }
}
