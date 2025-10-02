#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { DeployWebAppStack } from '../lib/deploy-web-app-stack';
import { ProductServiceStack } from '../lib/product-service-stack';

const app = new cdk.App();
new DeployWebAppStack(app, 'DeployWebAppStack', {});
new ProductServiceStack(app, 'ProductServiceStack', {});

// Some final Tags
cdk.Tags.of(app).add('Course', 'CloudeX: AWS Practitioner JS');
cdk.Tags.of(app).add('Environment', 'prod');
cdk.Tags.of(app).add('Owner', 'Ruben Cancino');

