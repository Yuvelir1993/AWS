import * as cdk from "aws-cdk-lib";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as s3deploy from "aws-cdk-lib/aws-s3-deployment";
import * as s3_notifications from "aws-cdk-lib/aws-s3-notifications";
import * as aws_lambda from "aws-cdk-lib/aws-lambda";
import * as aws_cloudfront from "aws-cdk-lib/aws-cloudfront";
import * as aws_cloudfront_origins from "aws-cdk-lib/aws-cloudfront-origins";
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
    const s3ProjectHubWebSpace = "projectHubWeb";
    const s3DocLinks = "docLinks.json";
    const removalPolicy =
      props.targetEnvConfig.bucketRemovalPolicy === "retain"
        ? cdk.RemovalPolicy.RETAIN
        : cdk.RemovalPolicy.DESTROY;

    const bucket = new s3.Bucket(this, "S3StorageBucket", {
      bucketName: props.targetEnvConfig.bucketName,
      versioned: props.targetEnvConfig.bucketVersioning,
      removalPolicy,
      autoDeleteObjects: removalPolicy === cdk.RemovalPolicy.DESTROY,
    });

    const distribution = new aws_cloudfront.Distribution(
      this,
      "DocusaurusDistribution",
      {
        defaultBehavior: {
          origin: new aws_cloudfront_origins.S3Origin(bucket),
          allowedMethods: aws_cloudfront.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
          compress: true,
          viewerProtocolPolicy:
            aws_cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        },
        defaultRootObject: `${s3ProjectHubWebSpace}/index.html`,
        errorResponses: [
          {
            httpStatus: 403,
            responseHttpStatus: 403,
            responsePagePath: "/error.html",
            ttl: cdk.Duration.minutes(30),
          },
        ],
        minimumProtocolVersion:
          aws_cloudfront.SecurityPolicyProtocol.TLS_V1_2_2019,
      }
    );

    // Deploy Docusaurus site to S3
    new s3deploy.BucketDeployment(this, "DeployDocusaurusSite", {
      sources: [
        s3deploy.Source.asset(
          path.join(__dirname, "..", "assets", "web", "build")
        ),
      ],
      destinationBucket: bucket,
      destinationKeyPrefix: `${s3ProjectHubWebSpace}/`,
    });

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

    new cdk.CfnOutput(this, "CloudFrontURL", {
      value: `https://${distribution.distributionDomainName}`,
      description: "The URL of the Docusaurus site via CloudFront",
    });

    new cdk.CfnOutput(this, "CfnOutDistributionId", {
      value: distribution.distributionId,
      description: "CloudFront Distribution Id",
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
