# Project Hub
Project which will aggregate your project's documentations and will serve as an entry point.
![Project Hub architecture with blue/green deployment strategy](./resource/projectHub.png)

# Dev
The `cdk.json` file tells the CDK Toolkit how to execute your app.

## Useful CDK commands

* `npm run build`                           compile typescript to js
* `npm run watch`                           watch for changes and compile
* `npm run test`                            perform the jest unit tests
* `npx cdk bootstrap`                       bootstrap the environment before deployment
* `npx cdk diff`                            compare deployed stack with current state
* `npx cdk synth`                           to validate, catch errors and make synthesized CloudFormation template
* `npx cdk deploy -c targetEnv=blue`        deploy this stack to your production AWS environment
* `npx cdk deploy -c targetEnv=green`       deploy this stack to your dev AWS environment
* `npx cdk destroy -c targetEnv=blue`       destroy the whole production AWS environment
* `npx cdk destroy -c targetEnv=green`      destroy the whole dev AWS environment

## Useful NPM commands
* `npx npm-check-updates` update all dependencies in package.json
