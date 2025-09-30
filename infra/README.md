# CloudX: Practitioner for JS Module 2

The service is complete, and the frontend has been deployed to AWS CloudFront.

### CloudFront URL: https://d3eaar2x0380tq.cloudfront.net/
### S3 Bucket URL: http://rcr-eshop-bucket.s3-website.us-east-2.amazonaws.com/ (Access Denied - 403 Forbidden)

## For Task 2.2 Automated Deployment, I created the necessary resources under a CloudFormation stack, which includes:

An S3 Bucket using L2 constructs
A CloudFront distribution
A bucket deployment for the local Angular project build
Several useful CfnOutputs
I also included npm scripts to build, synthesize, and deploy the site using the local CDK installation.

The CloudFormation template has been generated using the synth command.


 CloudFront URL: https://d3eaar2x0380tq.cloudfront.net


## Useful commands

* `npm run build`   compile typescript to js
* `npm run watch`   watch for changes and compile
* `npm run test`    perform the jest unit tests
* `npx cdk deploy`  deploy this stack to your default AWS account/region
* `npx cdk diff`    compare deployed stack with current state
* `npx cdk synth`   emits the synthesized CloudFormation template

