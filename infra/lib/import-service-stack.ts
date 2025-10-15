// Create an import service stack that imports resources from another stack
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import { LambdaDestination } from 'aws-cdk-lib/aws-s3-notifications';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as lambdaNodejs from 'aws-cdk-lib/aws-lambda-nodejs';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as path from 'path';

export class ImportServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: cdk.StackProps) {
    super(scope, id, props);

    // S3 Bucket to import bucket definition and create "uploaded" folder
    // wiht lyfecyle rule to auto delete objects uploaded/ objects after 10 days
    const bucket = new s3.Bucket(this, 'ImportedBucket', {
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      lifecycleRules: [
        {
          id: 'Auto-Delete-Objects',
          prefix: 'uploaded/',
          expiration: cdk.Duration.days(10),
        },
      ],
      cors: [
        {
          allowedMethods: [
            s3.HttpMethods.GET,
            s3.HttpMethods.PUT,
            s3.HttpMethods.POST,
          ],
          allowedOrigins: ['https://d1cifp48n770r7.cloudfront.net'],
          allowedHeaders: ['*'],
          exposedHeaders: ['ETag'],
        },
      ],
    });

    new s3deploy.BucketDeployment(this, 'CreateFolder', {
      sources: [s3deploy.Source.data('uploaded/.keep', ' ')],
      destinationBucket: bucket,
    });

    // Lambda function to generate pre-signed URL for uploading files
    const importProductsFileLambda = new lambdaNodejs.NodejsFunction(
      this,
      'ImportProductsFileLambda',
      {
        entry: path.join(__dirname, '../src/lambda', 'import-products-file.ts'),
        runtime: lambda.Runtime.NODEJS_22_X,
        timeout: cdk.Duration.seconds(30),
        memorySize: 256,
        environment: {
          S3_BUCKET_NAME: bucket.bucketName,
          URL_EXPIRATION: '300',
          NODE_OPTIONS: '--enable-source-maps',
        },
        bundling: {
          minify: true,
          sourceMap: true,
          target: 'es2020',
        },
      },
    );
    importProductsFileLambda.applyRemovalPolicy(cdk.RemovalPolicy.DESTROY);

    const parserLogs = new logs.LogGroup(this, 'ParserLogGroup', {
      logGroupName: '/aws/lambda/importFileParser',
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Create Lambda function for parsing uploaded files
    const importFileParserLambda = new lambdaNodejs.NodejsFunction(
      this,
      'ImportFileParserFunction',
      {
        runtime: lambda.Runtime.NODEJS_22_X,
        handler: 'handler',
        entry: path.join(__dirname, '../src/lambda', 'import-file-parser.ts'),
        functionName: 'importFileParser',
        timeout: cdk.Duration.minutes(5),
        memorySize: 512,
        logGroup: parserLogs,
        environment: {
          NODE_OPTIONS: '--enable-source-maps',
        },
        bundling: {
          minify: true,
          sourceMap: true,
          target: 'es2020',
        },
      },
    );
    importFileParserLambda.applyRemovalPolicy(cdk.RemovalPolicy.DESTROY);

    // Grant the Lambda function permissions to put objects in the bucket
    bucket.grantPut(importProductsFileLambda, 'uploaded/*');
    bucket.grantRead(importFileParserLambda, 'uploaded/*');
    bucket.grantReadWrite(importFileParserLambda, 'processed/*');
    bucket.grantDelete(importFileParserLambda, 'uploaded/*');

    // Add S3 event notification for the importFileParser Lambda
    bucket.addEventNotification(
      s3.EventType.OBJECT_CREATED,
      new LambdaDestination(importFileParserLambda),
      {
        prefix: 'uploaded/',
        suffix: '.csv',
      },
    );

    // Create API Gateway with /import endpoint and GET method linked to the Lambda function
    const api = new apigateway.RestApi(this, 'ProductsImportApi', {
      restApiName: 'Import Products Service',
      description: 'This service generates pre-signed URLs for file uploads.',
      deployOptions: {
        stageName: 'prod',
      },
      defaultCorsPreflightOptions: {
        allowOrigins: ['https://d1cifp48n770r7.cloudfront.net/'],
        allowMethods: apigateway.Cors.ALL_METHODS,
      },
    });
    const importResource = api.root.addResource('import');
    importResource.addMethod(
      'GET',
      new apigateway.LambdaIntegration(importProductsFileLambda, {
        requestTemplates: { 'application/json': '{"statusCode": 200}' },
      }),
      {
        requestParameters: { 'method.request.querystring.fileName': true },
        methodResponses: [
          {
            statusCode: '200',
            responseParameters: {
              'method.response.header.Access-Control-Allow-Origin': true,
            },
          },
          {
            statusCode: '400',
            responseParameters: {
              'method.response.header.Access-Control-Allow-Origin': true,
            },
          },
          {
            statusCode: '500',
            responseParameters: {
              'method.response.header.Access-Control-Allow-Origin': true,
            },
          },
        ],
      },
    );
    // Add an associated a request validator
    const requestValidator = new apigateway.RequestValidator(
      this,
      'ImportRequestValidator',
      {
        restApi: api,
        requestValidatorName: 'ImportRequestValidator',
        validateRequestParameters: true,
        validateRequestBody: false,
      },
    );
    const cfnMethod = importResource.node.defaultChild as apigateway.CfnMethod;
    cfnMethod.requestValidatorId = requestValidator.requestValidatorId;

    // Some outputs for easy access

    new cdk.CfnOutput(this, 'ImportApiUrl', {
      value: api.url,
      description: 'Import Products URL',
    });
    new cdk.CfnOutput(this, 'ImportEndpoint', {
      value: `${api.url}import`,
      description: 'Import Products Endpoint',
    });

    new cdk.CfnOutput(this, 'ImportProductsFileLambdaArn', {
      value: importProductsFileLambda.functionArn,
      exportName: 'ImportProductsFileLambdaArn',
    });
    new cdk.CfnOutput(this, 'ImportedBucketName', {
      value: bucket.bucketName,
      exportName: 'ImportedBucketName',
    });

    // Some final Tags
    cdk.Tags.of(this).add('Module 5', 'Integration with S3');
    cdk.Tags.of(this).add('Task 5.1', 'CDK Stack Creation');
  }
}
