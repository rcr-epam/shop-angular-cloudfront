import { Construct } from "constructs";
import * as cdk from "aws-cdk-lib";
import { Bucket, BlockPublicAccess } from "aws-cdk-lib/aws-s3";
import { Distribution, ViewerProtocolPolicy } from "aws-cdk-lib/aws-cloudfront";
import { S3BucketOrigin } from "aws-cdk-lib/aws-cloudfront-origins";
import { BucketDeployment } from "aws-cdk-lib/aws-s3-deployment";
import * as path from "path";

export class DeploymentService extends Construct {
  constructor(scope: Construct, id: string) {
    super(scope, id);

    // Create a s3 bucket
    const bucket = new Bucket(this, "FrontEnd_Bucket", {
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
      websiteIndexDocument: "index.html",
      // removalPolicy: cdk.RemovalPolicy.DESTROY,
      // autoDeleteObjects: true,
    });

    // Create a CloudFront distribution
    const distribution = new Distribution(this, "FrontEnd_Distribution", {
      defaultBehavior: {
        origin: S3BucketOrigin.withOriginAccessControl(bucket),
        viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      },
      defaultRootObject: "index.html",
      errorResponses: [
        {
          httpStatus: 404,
          responseHttpStatus: 200,
          responsePagePath: "/index.html",
        },
      ],
    });

    new BucketDeployment(this, "DeployWebsite", {
      sources: [cdk.aws_s3_deployment.Source.asset(path.join(__dirname, '../../dist/app/browser') )],
      destinationBucket: bucket,
      distribution,
      distributionPaths: ["/*"],
    });

    new cdk.CfnOutput(this, "CloudFrontURL", {
      value: distribution.domainName,
      description: "URL of the CloudFront Distribution",
      exportName: "InfraCloudFrontURL",
    });

    new cdk.CfnOutput(this, "BucketName", {
      value: bucket.bucketName,
      description: "Shop Angular Web hosting bucket",
      exportName: "ShopAngularHostBucketName",
    });

    new cdk.CfnOutput(this, "BucketWebsiteURL", {
      value: bucket.bucketWebsiteUrl,
      description: "URL of the Bucket web hosting",
      exportName: "BucketWebsiteURL",
    });

  }
}
