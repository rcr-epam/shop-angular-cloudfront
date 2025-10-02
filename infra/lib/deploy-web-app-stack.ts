import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { DeploymentService } from './deployment-service';

export class DeployWebAppStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    new DeploymentService(this, 'deployment');
    // Some final Tags
    cdk.Tags.of(this).add('Module 2', 'Serverless');
    cdk.Tags.of(this).add('Task 2.2', 'Automated Deployment');
  }
}
