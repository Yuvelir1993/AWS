import * as cdk from "aws-cdk-lib";
import * as s3 from "aws-cdk-lib/aws-s3";
// import * as iam from "aws-cdk-lib/aws-iam";
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
    const s3DocLinksJson = "docLinks.json";

    const removalPolicy =
      envConfig.bucketRemovalPolicy === "retain"
        ? cdk.RemovalPolicy.RETAIN
        : cdk.RemovalPolicy.DESTROY;

    const bucket = new s3.Bucket(this, "S3StorageBucket", {
      versioned: true,
      removalPolicy,
      autoDeleteObjects: removalPolicy === cdk.RemovalPolicy.DESTROY,

      // -----------------------------------
      // Uncomment only for tests!
      // -----------------------------------
      // publicReadAccess: true,
      // blockPublicAccess: {
      //   blockPublicAcls: false,
      //   blockPublicPolicy: false,
      //   ignorePublicAcls: false,
      //   restrictPublicBuckets: false,
      // },
      // websiteIndexDocument: 'index.html',
    });
    // bucket.grantRead(new iam.AnyPrincipal());

    const lambdaFunctionDocuMetadataProcessing = new aws_lambda.Function(
      this,
      "LambdaFunctionDocuMetadataProcessing",
      {
        runtime: aws_lambda.Runtime.PYTHON_3_12,
        handler: "lambda-handler.generate_doc_links_on_upload",
        code: aws_lambda.Code.fromAsset(path.join(__dirname, "lambda")),
        environment: {
          BUCKET_NAME: bucket.bucketName,
          PREFIX_DOCUMENTATION: s3PrefixDocumentation,
          DOC_LINKS_FILE_PATH: `${s3PrefixDocumentationMetadata}/${s3DocLinksJson}`,
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
    bucket.grantRead(
      lambdaFunctionDocuMetadataProcessing,
      `${s3PrefixDocumentation}/*.zip`
    );
    bucket.grantReadWrite(
      lambdaFunctionDocuMetadataProcessing,
      `${s3PrefixDocumentationMetadata}/${s3DocLinksJson}`
    );

    new cdk.CfnOutput(this, "UploadCommand", {
      value: `aws s3 cp test-1.0.0.zip s3://${bucket.bucketName}/${s3PrefixDocumentation}/test-1.0.0.zip`,
      description: "Test AWS CLI command to upload the project zip file to S3",
    });
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
