import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as iam from "aws-cdk-lib/aws-iam";

interface MyStackProps extends cdk.StackProps {
  targetEnv: String;
  targetEnvConfig: any;
}

export class EC2InstanceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: MyStackProps) {
    super(scope, id, props);

    const vpc = ec2.Vpc.fromLookup(this, "DefaultVpc", { isDefault: true });
    const securityGroup = new ec2.SecurityGroup(this, "EC2SecurityGroup", {
      vpc,
      allowAllOutbound: true,
    });

    securityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      "Allow HTTP traffic"
    );

    const role = new iam.Role(this, "EC2InstanceRole", {
      assumedBy: new iam.ServicePrincipal("ec2.amazonaws.com"),
    });

    role.addToPolicy(
      new iam.PolicyStatement({
        actions: ["s3:GetObject"],
        resources: [
          `arn:aws:s3:::${props.targetEnvConfig.bucketName}/projectHubWeb/*`,
        ],
      })
    );

    const userData = ec2.UserData.forLinux();
    userData.addCommands(
      // Update and install Apache
      "yum update -y",
      "yum install -y httpd",
      "systemctl enable httpd",
      "systemctl start httpd",

      // Create and access the temp directory
      "mkdir /temp",
      "cd /temp",

      // Download the website zip file from S3
      `aws s3 cp s3://${props.targetEnvConfig.bucketName}/projectHubWeb/projectHubWeb.zip projectHubWeb.zip`,

      // Unzip the project files and move them to /var/www/html
      "unzip projectHubWeb.zip",
      "cd projectHubWeb",
      "mv * /var/www/html/",

      // Ensure the web server is serving content
      "systemctl restart httpd"
    );

    const instance = new ec2.Instance(this, "EC2Instance", {
      vpc,
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T3,
        ec2.InstanceSize.MICRO
      ),
      machineImage: ec2.MachineImage.latestAmazonLinux2(),
      securityGroup,
      role,
      userData,
    });

    new cdk.CfnOutput(this, "InstancePublicIp", {
      value: instance.instancePublicIp,
      description: "Public IP of the EC2 instance hosting the website",
    });
  }
}
