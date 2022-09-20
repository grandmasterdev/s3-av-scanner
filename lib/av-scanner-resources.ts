import { Construct } from "constructs";
import {
  CfnOutput,
  aws_ec2 as ec2,
  aws_ecs as ecs,
  aws_ecs_patterns as ecs_patterns,
} from "aws-cdk-lib";
import { AvScannerResourcesProps } from "./types";

export class AvScannerResources extends Construct {
  constructor(scope: Construct, id: string, props: AvScannerResourcesProps) {
    super(scope, id);

    const { bucket } = props;

    const vpc = new ec2.Vpc(this, `${id}-vpc`, {
        maxAzs: 3
    });

    const cluster = new ecs.Cluster(this, `${id}-cluster`, {
        vpc
    })

    new ecs_patterns.ApplicationLoadBalancedFargateService(this, `${id}-fargate-service`, {
        cluster,
        cpu: 512,
        desiredCount: 2,
        taskImageOptions: {
            image: ecs.ContainerImage.fromAsset('')
        }
    })

    new CfnOutput(this, `oBucketName`, {
      description: "The name of the input S3 Bucket",
      value: bucket.bucketName,
    });
  }
}
