import * as cdk from "aws-cdk-lib";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as s3_notifications from "aws-cdk-lib/aws-s3-notifications";
import * as aws_lambda from "aws-cdk-lib/aws-lambda";
import { Construct } from "constructs";
import * as child_process from "child_process";
import { MyStackProps } from "./data-model";
import path = require("path");
import * as iam from "aws-cdk-lib/aws-iam";
import { Commons } from "./commons";

export class DataProcessingStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: MyStackProps) {
    super(scope, id, props);

    const removalPolicy =
      props.myEnvProps.targetEnvConfig.bucketRemovalPolicy === "retain"
        ? cdk.RemovalPolicy.RETAIN
        : cdk.RemovalPolicy.DESTROY;

    const bucket = new s3.Bucket(this, "S3StorageBucket", {
      bucketName: props.myEnvProps.targetEnvConfig.bucketName,
      versioned: props.myEnvProps.targetEnvConfig.bucketVersioning,
      removalPolicy,
      autoDeleteObjects: removalPolicy === cdk.RemovalPolicy.DESTROY,
      websiteIndexDocument: "index.html",
      publicReadAccess: false,
    });

    const lambdaProjectDocsProcessing = new aws_lambda.Function(
      this,
      "LambdaProjectDocsProcessing",
      {
        description: `Lambda function to react on uploading objects and doing necessary actions like unzipping archives and generating 'docLinks.json'.`,
        runtime: aws_lambda.Runtime.PYTHON_3_13,
        handler: "lambda-handler.generate_doc_links_on_upload",
        code: aws_lambda.Code.fromAsset(path.join(__dirname, "lambda")),
        environment: {
          BUCKET_NAME: bucket.bucketName,
          PROJECTS_SPACE: Commons.S3_SPACE_PROJECTS,
          DOC_LINKS_JSON: Commons.S3_DOC_LINKS,
        },
        layers: [
          this.createDependenciesLayer(
            this.stackName,
            "LambdaProjectDocsProcessing"
          ),
        ],
      }
    );
    const lambdaDestination = new s3_notifications.LambdaDestination(
      lambdaProjectDocsProcessing
    );

    bucket.addObjectCreatedNotification(lambdaDestination, {
      prefix: Commons.S3_SPACE_PROJECTS,
      suffix: ".zip",
    });
    bucket.grantRead(
      lambdaProjectDocsProcessing,
      `${Commons.S3_SPACE_PROJECTS}/*.zip`
    );
    bucket.grantPut(lambdaProjectDocsProcessing);
    bucket.grantReadWrite(lambdaProjectDocsProcessing, Commons.S3_DOC_LINKS);
    bucket.grantRead(
      props.ec2InstanceRole!,
      `${Commons.S3_SPACE_PROJECT_HUB_WEB}/*`
    );

    const bucketArn = bucket.bucketArn;
    const vpcId = props.vpcProps?.vpc.vpcId;
    const vpcEndpointId = props.vpcProps?.vpcGatewayEndpoint.vpcEndpointId;

    const bucketPolicy = new iam.PolicyStatement({
      sid: `Access-to-specific-VPCE-only-${props.myEnvProps.targetEnv}`,
      principals: [new iam.AnyPrincipal()],
      actions: ["s3:GetObject"],
      effect: iam.Effect.ALLOW,
      resources: [`${bucketArn}/*`],
      conditions: {
        StringEquals: {
          "aws:sourceVpce": vpcEndpointId,
        },
      },
    });

    bucket.addToResourcePolicy(bucketPolicy);

    // https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-s3-accesspoint-publicaccessblockconfiguration.html
    new s3.CfnAccessPoint(
      this,
      `MyCfnAccessPoint-${props.myEnvProps.targetEnv}`,
      {
        name: `vpc-to-s3-${props.myEnvProps.targetEnv}`,
        bucket: bucket.bucketName,
        vpcConfiguration: {
          vpcId,
        },
      }
    );

    new cdk.CfnOutput(this, "UploadCommand", {
      value: `aws s3 cp ../app/resources/sample-python/PythonApi-0.1.0.zip s3://${bucket.bucketName}/${Commons.S3_SPACE_PROJECTS}/PythonApi-0.1.0.zip`,
      description:
        "Test AWS CLI command to upload the project's docs zip file to S3",
    });
  }

  private createDependenciesLayer(
    stackName: string,
    functionName: string
  ): aws_lambda.LayerVersion {
    const requirementsFile = path.join(__dirname, "lambda", "requirements.txt");
    const outputDir = path.join(".build", "app");

    if (!process.env.SKIP_PIP) {
      child_process.execSync(
        `pip install -r ${requirementsFile} -t ${path.join(
          outputDir,
          "python"
        )}`
      );
    }

    const layerId = `${stackName}-${functionName}-dependencies`;
    const layerCode = aws_lambda.Code.fromAsset(outputDir);
    const myLayer = new aws_lambda.LayerVersion(this, layerId, {
      code: layerCode,
    });

    return myLayer;
  }
}