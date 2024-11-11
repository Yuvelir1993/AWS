import * as cdk from "aws-cdk-lib";
import * as s3 from "aws-cdk-lib/aws-s3";
// import * as iam from "aws-cdk-lib/aws-iam";
import * as s3_notifications from "aws-cdk-lib/aws-s3-notifications";
import * as aws_lambda from "aws-cdk-lib/aws-lambda";
import { Construct } from "constructs";
import * as child_process from "child_process";
import path = require("path");

interface MyStackProps extends cdk.StackProps {
  targetEnv: String;
  targetEnvConfig: any;
}

export class DataProcessingStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: MyStackProps) {
    super(scope, id, props);

    const s3ProjectsSpace = "projects";
    const s3DocLinks = "docLinks.json";
    const removalPolicy =
      props.targetEnvConfig.bucketRemovalPolicy === "retain"
        ? cdk.RemovalPolicy.RETAIN
        : cdk.RemovalPolicy.DESTROY;

    const bucket = new s3.Bucket(this, "S3StorageBucket", {
      bucketName: props.targetEnvConfig.bucketName,
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

    const lambdaProjectDocsProcessing = new aws_lambda.Function(
      this,
      "LambdaProjectDocsProcessing",
      {
        runtime: aws_lambda.Runtime.PYTHON_3_12,
        handler: "lambda-handler.generate_doc_links_on_upload",
        code: aws_lambda.Code.fromAsset(path.join(__dirname, "lambda")),
        environment: {
          BUCKET_NAME: bucket.bucketName,
          PROJECTS_SPACE: s3ProjectsSpace,
          DOC_LINKS_JSON: s3DocLinks,
        },
        layers: [
          this.createDependenciesLayer(this.stackName, "LambdaProjectDocsProcessing"),
        ],
      }
    );
    const lambdaDestination = new s3_notifications.LambdaDestination(
      lambdaProjectDocsProcessing
    );

    bucket.addObjectCreatedNotification(lambdaDestination, {
      prefix: s3ProjectsSpace,
      suffix: ".zip",
    });
    bucket.grantRead(lambdaProjectDocsProcessing, `${s3ProjectsSpace}/*.zip`);
    bucket.grantReadWrite(lambdaProjectDocsProcessing, s3DocLinks);

    new cdk.CfnOutput(this, "UploadCommand", {
      value: `aws s3 cp ./assets/web/resources/sample-python/PythonApi-0.1.0.zip s3://${bucket.bucketName}/${s3ProjectsSpace}/PythonApi-0.1.0.zip`,
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
