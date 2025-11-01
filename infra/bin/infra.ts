#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { DeployWebAppStack } from '../lib/deploy-web-app-stack';
import { ProductServiceStack } from '../lib/product-service-stack';
import { ImportServiceStack } from '../lib/import-service-stack';

const app = new cdk.App();
new DeployWebAppStack(app, 'DeployWebAppStack', {});
new ProductServiceStack(app, 'ProductServiceStack', {
  productsTable: 'products',
  stockTable: 'stock',
});
new ImportServiceStack(app, 'ImportServiceStack', {
  description: 'Stack to support import products from CSV file',
});

// Some final Tags
cdk.Tags.of(app).add('Course', 'CloudeX: AWS Practitioner JS');
cdk.Tags.of(app).add('Environment', 'prod');
cdk.Tags.of(app).add('Owner', 'Ruben Cancino');
