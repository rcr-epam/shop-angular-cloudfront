import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { DeploymentService } from './deployment-service';

export class DeployWebAppStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    new DeploymentService(this, 'deployment');

    // Add a Tag to all resources in this stack to identify them
    cdk.Tags.of(this).add("Project", "CloudX: Practitioner for JS Module 2");
  }
}
