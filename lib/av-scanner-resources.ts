import { Construct } from "constructs";
import {
  CfnOutput,
  aws_ec2 as ec2,
  aws_ecs as ecs,
  aws_ecs_patterns as ecs_patterns,
  aws_lambda as lambda,
  aws_lambda_event_sources as lambda_event_sources,
  aws_sqs as sqs,
  Duration,
} from "aws-cdk-lib";
import { AvScannerResourcesProps } from "./types";
import { RetentionDays } from "aws-cdk-lib/aws-logs";

export class AvScannerResources extends Construct {
  private readonly infectedQueueName: string = "av-infected-queue";
  private readonly containerName: string = "clamav-container";
  private readonly containerServiceName: string = "clamav-service";
  private readonly clusterName: string = "clamav-cluster";
  private readonly loadBalancerName: string = "clamav-load-balancer";

  public scanBucketFunction: lambda.Function;

  constructor(scope: Construct, id: string, props: AvScannerResourcesProps) {
    super(scope, id);

    const { queue, bucket, scannedBucket } = props;

    /**
     * Scanner agent resources
     */
    const vpc = new ec2.Vpc(this, `${id}-vpc`, {
      maxAzs: 3
    });

    const cluster = new ecs.Cluster(this, `${id}-cluster`, {
      clusterName: this.clusterName,
      vpc,
    });

    const clamavEcsPattern =
      new ecs_patterns.ApplicationLoadBalancedFargateService(
        this,
        `${id}-fargate-service`,
        {
          cluster,
          cpu: 512,
          memoryLimitMiB: 3072,
          desiredCount: 1,
          circuitBreaker: {
            rollback: true,
          },
          taskImageOptions: {
            image: ecs.ContainerImage.fromRegistry(
              "gamemasterdev/clamav:latest"
            ),
            containerName: this.containerName,
            logDriver: ecs.LogDriver.awsLogs({
              streamPrefix: `${id}-fargate-service`,
              logRetention: RetentionDays.TWO_WEEKS,
            }),
          },
          healthCheckGracePeriod: Duration.minutes(10),
          enableExecuteCommand: true,
          serviceName: this.containerServiceName,
          loadBalancerName: this.loadBalancerName,
          publicLoadBalancer: false,
        }
      );

    /**
     * Notification resources
     */
    const infectedQueue = new sqs.Queue(this, `${id}-process-queue`, {
      queueName: this.infectedQueueName,
      retentionPeriod: Duration.days(7),
    });

    this.scanBucketFunction = new lambda.Function(this, `${id}-function`, {
      functionName: "scan-bucket",
      handler: "index.handler",
      runtime: lambda.Runtime.NODEJS_16_X,
      memorySize: 128,
      code: lambda.Code.fromAsset("dist/lambda"),
      logRetention: RetentionDays.ONE_DAY,
      vpc,
      environment: {
        CLAMAV_ELB_HOST: clamavEcsPattern.loadBalancer.loadBalancerDnsName,
        SCANNED_BUCKET_NAME: scannedBucket.bucketName,
        INFECTED_QUEUE_URL: infectedQueue.queueUrl,
      },
    });
    this.scanBucketFunction.addEventSource(
      new lambda_event_sources.SqsEventSource(queue)
    );

    bucket.grantReadWrite(this.scanBucketFunction);
    scannedBucket.grantReadWrite(this.scanBucketFunction);
    queue.grantConsumeMessages(this.scanBucketFunction);
    infectedQueue.grantSendMessages(this.scanBucketFunction);

    /**
     * Outputs
     */
    new CfnOutput(this, `oInfectedQueue`, {
      description: "The name of infected bucket",
      value: queue.queueArn,
    });

    new CfnOutput(this, `oEcsLoadbalancerDns`, {
      description: 'The ECS cluster load balancer task',
      value: clamavEcsPattern.loadBalancer.loadBalancerDnsName
    })
  }
}
