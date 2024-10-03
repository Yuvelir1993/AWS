import * as cdk from "aws-cdk-lib";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as s3_notifications from "aws-cdk-lib/aws-s3-notifications";
import * as aws_lambda from "aws-cdk-lib/aws-lambda";
import { Construct } from "constructs";
import * as child_process from "child_process";
import path = require("path");

export class DataProcessingStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const envConfig = this.node.tryGetContext(process.env.CDK_ENV || "dev");
    const s3PrefixDocumentation = "documentation";
    const s3PrefixDocumentationMetadata = "documentationMetadata";

    const removalPolicy =
      envConfig.bucketRemovalPolicy === "retain"
        ? cdk.RemovalPolicy.RETAIN
        : cdk.RemovalPolicy.DESTROY;

    const bucket = new s3.Bucket(this, "S3StorageBucket", {
      versioned: true,
      removalPolicy,
      autoDeleteObjects: removalPolicy === cdk.RemovalPolicy.DESTROY,
      // lifecycleRules: [
      //   {
      //     id: "deleteOldVersions",
      //     prefix: s3PrefixDocumentation,
      //     enabled: true,
      //     expiration: cdk.Duration.days(7),
      //   },
      // ],
    });

    const lambdaFunctionDocuMetadataProcessing = new aws_lambda.Function(
      this,
      "LambdaFunctionDocuMetadataProcessing",
      {
        runtime: aws_lambda.Runtime.PYTHON_3_12,
        handler: "lambda-handler.read_from_s3",
        code: aws_lambda.Code.fromAsset(path.join(__dirname, "lambda")),
        environment: {
          BUCKET_NAME: bucket.bucketName,
          PREFIX_DOCUMENTATION: s3PrefixDocumentation,
          PREFIX_DOCUMENTATION_METADATA: s3PrefixDocumentationMetadata,
        },
        layers: [
          this.createDependenciesLayer(this.stackName, "lambda/lambda-handler"),
        ],
      }
    );
    const lambdaDestination = new s3_notifications.LambdaDestination(
      lambdaFunctionDocuMetadataProcessing
    );

    bucket.addObjectCreatedNotification(lambdaDestination, {
      prefix: s3PrefixDocumentation,
      suffix: ".zip",
    });
    bucket.grantRead(lambdaFunctionDocuMetadataProcessing);
  }

  private createDependenciesLayer(
    projectName: string,
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

    const layerId = `${projectName}-${functionName}-dependencies`;
    const layerCode = aws_lambda.Code.fromAsset(outputDir);
    const myLayer = new aws_lambda.LayerVersion(this, layerId, {
      code: layerCode,
    });

    return myLayer;
  }
}
