# Welcome to your CDK TypeScript project

This is a blank project for CDK development with TypeScript.

The `cdk.json` file tells the CDK Toolkit how to execute your app.

## Useful commands

* `npm run build`       compile typescript to js
* `npm run watch`       watch for changes and compile
* `npm run test`        perform the jest unit tests
* `npx cdk bootstrap`   bootstrap the AWS environment
* `npx cdk diff`        compare deployed stack with current state
* `npx cdk synth`       emits the synthesized CloudFormation template
* `npx cdk deploy`      deploy this stack to your default AWS account/region
* `npx cdk destroy`     destroys this stack

# SSH
Use only Linux since public key downloading on Windows will not work by using it on linux (probably some encoding problem).
Example is based on [cdk-ec2 example](https://github.com/cloudbrilliant/cdk-ec2).

## Get Instance info
`aws ec2 describe-instances --query 'Reservations[*].Instances[*].[InstanceId, InstanceType, State.Name, KeyName, PublicIpAddress, PublicDnsName]' --output table`

## List Parameters (to find CDK generated keys)
`aws ssm describe-parameters`

## Download key as .pem file locally
(key name string will look something like this /ec2/keypair/key-000000)
`aws ssm get-parameter --name /ec2/keypair/key-025f6bcea3039c5b0 --with-decryption --query "Parameter.Value" --output text > mykey.pem`

## Set file permissions
Move to WSL first since Windows filesystem not handling it correctly.
`chmod 400 mykey.pem`

## SSH into new instance
(update ec2-00-00-00-00.compute-1.amazonaws.com)
`ssh -i "mykey.pem" ec2-user@ec2-3-70-247-208.eu-central-1.compute.amazonaws.com`