import * as cdk from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as lambdaNodejs from "aws-cdk-lib/aws-lambda-nodejs";
import * as path from 'path';
import { Construct } from 'constructs';

export class ProductServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const getProductsLambda = new lambdaNodejs.NodejsFunction(this, 'GetProducts', {
      entry: path.join(__dirname, '../src/lambda','get-products-list.ts'),
      runtime: lambda.Runtime.NODEJS_22_X,
      timeout: cdk.Duration.seconds(30),
      memorySize: 256,
      bundling: {
        minify: true,
        sourceMap: true
      }

    });

    // Lambda function for getting product by ID
    const getProductByIdLambda = new lambdaNodejs.NodejsFunction(this, 'GetProductById', {
      entry: path.join(__dirname, '../src/lambda','get-product-by-id.ts'),
      runtime: lambda.Runtime.NODEJS_22_X,
      timeout: cdk.Duration.seconds(30),
      memorySize: 256,
      bundling: {
        minify: true,
        sourceMap: true
      }
    });

    // Create API Gateway REST API with Swagger documentation
    const api = new apigateway.RestApi(this, 'ProductsAPI', {
      restApiName: 'Products API',
      description: 'REST API for Products',
      deployOptions: {
        stageName: 'prod',
      },
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
      }
    });

    // Define the API model for Product
    api.addModel('ProductModel', {
      contentType: 'application/json',
      modelName: 'Product',
      schema: {
        type: apigateway.JsonSchemaType.OBJECT,
        properties: {
          id: { type: apigateway.JsonSchemaType.STRING },
          title: { type: apigateway.JsonSchemaType.STRING },
          description: { type: apigateway.JsonSchemaType.STRING },
          price: { type: apigateway.JsonSchemaType.NUMBER },
          count: { type: apigateway.JsonSchemaType.INTEGER }
        },
        required: ['id', 'title', 'price', 'count']
      }
    });

    // Define response models
    const errorResponseModel = api.addModel('ErrorResponse', {
      contentType: 'application/json',
      modelName: 'ErrorResponse',
      schema: {
        type: apigateway.JsonSchemaType.OBJECT,
        properties: {
          success: { type: apigateway.JsonSchemaType.BOOLEAN },
          error: { type: apigateway.JsonSchemaType.STRING },
          message: { type: apigateway.JsonSchemaType.STRING }
        },
        required: ['success', 'error', 'message']
      }
    });

    const productsResponseModel = api.addModel('ProductsResponse', {
      contentType: 'application/json',
      modelName: 'ProductsResponse',
      schema: {
        type: apigateway.JsonSchemaType.OBJECT,
        properties: {
          success: { type: apigateway.JsonSchemaType.BOOLEAN },
          data: {
            type: apigateway.JsonSchemaType.ARRAY,
            items: { type: apigateway.JsonSchemaType.OBJECT }
          },
          total: { type: apigateway.JsonSchemaType.INTEGER }
        },
        required: ['success', 'data', 'total']
      }
    });

    const productResponseModel = api.addModel('ProductResponse', {
      contentType: 'application/json',
      modelName: 'ProductResponse',
      schema: {
        type: apigateway.JsonSchemaType.OBJECT,
        properties: {
          success: { type: apigateway.JsonSchemaType.BOOLEAN },
          data: { type: apigateway.JsonSchemaType.OBJECT }
        },
        required: ['success', 'data']
      }
    });

    // Create /products resource
    const products = api.root.addResource('products');

    // GET /products
    products.addMethod('GET', new apigateway.LambdaIntegration(getProductsLambda), {
      methodResponses: [
        {
          statusCode: '200',
          responseModels: {
            'application/json': productsResponseModel
          }
        },
        {
          statusCode: '500',
          responseModels: {
            'application/json': errorResponseModel
          }
        }
      ]
    });

    // Create /products/{id} resource
    const productById = products.addResource('{id}');

    // GET /products/{id}
    productById.addMethod('GET', new apigateway.LambdaIntegration(getProductByIdLambda), {
      requestParameters: {
        'method.request.path.id': true
      },
      methodResponses: [
        {
          statusCode: '200',
          responseModels: {
            'application/json': productResponseModel
          }
        },
        {
          statusCode: '400',
          responseModels: {
            'application/json': errorResponseModel
          }
        },
        {
          statusCode: '404',
          responseModels: {
            'application/json': errorResponseModel
          }
        },
        {
          statusCode: '500',
          responseModels: {
            'application/json': errorResponseModel
          }
        }
      ]
    });

    // Output the API URL
    new cdk.CfnOutput(this, 'ApiUrl', {
      value: api.url,
      description: 'URL of the Products API'
    });

    new cdk.CfnOutput(this, "ProductsApiUrl", {
      value: `${api.url}products`,
      description: "The URL of the /products resource",
    });

    new cdk.CfnOutput(this, "ProductsApiByIdUrl", {
      value: `${api.url}products/{id}`,
      description: "The URL of the /products/{id} resource",
    });

    // Output Swagger/OpenAPI documentation URL
    new cdk.CfnOutput(this, 'SwaggerUrl', {
      value: `${api.url}swagger`,
      description: 'Swagger documentation URL'
    });

    // Some final Tags
    cdk.Tags.of(this).add("Module 3", "Serverless");
    cdk.Tags.of(this).add("Task 3", "Products API");

    // Cleanup all log groups
    cdk.Aspects.of(this).add({
      visit(node): void {
        if (node instanceof cdk.aws_logs.LogGroup) {
          node.applyRemovalPolicy(cdk.RemovalPolicy.DESTROY);
        }
      },
    });
  }
}
