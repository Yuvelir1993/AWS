import * as cdk from "aws-cdk-lib";
import * as iam from "aws-cdk-lib/aws-iam";
import { Construct } from "constructs";
import { MyStackProps } from "./data-model";
import { Commons } from "./commons";

export class IamRoleStack extends cdk.Stack {
  public readonly ec2InstanceRole: iam.IRole;

  constructor(scope: Construct, id: string, props: MyStackProps) {
    super(scope, id, props);

    this.ec2InstanceRole = new iam.Role(
      this,
      `EC2InstanceRole-${props.targetEnv}`,
      {
        assumedBy: new iam.ServicePrincipal("ec2.amazonaws.com"),
      }
    );

    const s3BucketObjectsArn = `arn:aws:s3:::${props.targetEnvConfig.bucketName}/${Commons.S3_SPACE_PROJECT_HUB_WEB}/*`;

    this.ec2InstanceRole.addToPrincipalPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ["s3:GetObject"],
        resources: [s3BucketObjectsArn],
      })
    );
  }
}
