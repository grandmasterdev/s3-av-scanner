import { Construct } from "constructs";
import {
  CfnOutput,
  aws_ec2 as ec2,
  aws_ecs as ecs,
  aws_ecs_patterns as ecs_patterns,
  aws_lambda as lambda,
  aws_lambda_event_sources as lambda_event_sources,
  Duration,
} from "aws-cdk-lib";
import { AvScannerResourcesProps, Configuration } from "../types";
import { RetentionDays } from "aws-cdk-lib/aws-logs";
import accb from "aws-cdk-config-builder";
import { NoficationResources } from "./notification-resources";
import { CfnWebACLAssociation } from "aws-cdk-lib/aws-wafv2";

export class AvScannerResources extends Construct {
  private readonly configuration: Configuration;

  private readonly containerImage: string = "gamemasterdev/clamav:latest";
  private readonly containerName: string = "clamav-container";
  private readonly containerServiceName: string = "clamav-service";
  private readonly clusterName: string = "clamav-cluster";
  private readonly loadBalancerName: string = "clamav-load-balancer";

  public scanBucketFunction: lambda.Function;

  constructor(scope: Construct, id: string, props: AvScannerResourcesProps) {
    super(scope, id);

    const environment = this.node.tryGetContext("environment") ?? "dev";

    console.log("environment", environment);

    this.configuration = accb
      .getInstance(this)
      .build<Configuration>(environment) as Configuration;

    const {
      incomingBucket,
      infectedBucket,
      scannedBucket,
      bucketList,
      incomingQueue,
      waf,
    } = props || {};

    if (!incomingQueue) {
      throw new Error(`Missing incomingQueue`);
    }

    /**
     * Scanner agent resources
     */
    const vpc = new ec2.Vpc(this, `${id}-vpc`, {
      maxAzs: 2,
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
            image: ecs.ContainerImage.fromRegistry(this.containerImage),
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
     * Add WAF association to the ALB
     */
    if (this.configuration.scanningAgentAv.enableWaf) {
      new CfnWebACLAssociation(this, "av-waf-ass", {
        webAclArn: waf?.attrArn as string,
        resourceArn: clamavEcsPattern.loadBalancer.loadBalancerArn,
      });
    }

    /**
     * Notification resources
     */
    const avNotification = new NoficationResources(this, `avn`, {});

    /**
     * Event triggered lambda function
     */
    this.scanBucketFunction = new lambda.Function(this, `${id}-function`, {
      functionName: "scan-bucket",
      handler: "index.handler",
      runtime: lambda.Runtime.NODEJS_16_X,
      timeout: Duration.minutes(3),
      memorySize: this.configuration.scanningAgentLambda.memorySize ?? 128,
      code: lambda.Code.fromAsset("dist/lambda"),
      logRetention: RetentionDays.ONE_DAY,
      vpc,
      environment: {
        CLAMAV_ELB_HOST: clamavEcsPattern.loadBalancer.loadBalancerDnsName,
        INFECTED_QUEUE_URL: avNotification.infectedQueue.queueUrl,
        CLEAN_QUEUE_URL: avNotification.cleanQueue.queueUrl,
        CUSTOM_BUCKET_LIST_STR: this.configuration.incomingBucketArnList
          ? this.configuration.incomingBucketArnList.join(" , ")
          : "NONE",
        DEFAULT_INCOMING_BUCKET:
          this.configuration.defaultIncomingBucket === false ? "false" : "true",
        DEFAULT_INFECTED_BUCKET:
          this.configuration.defaultInfectedBucket === false ? "false" : "true",
      },
    });

    /**
     * List of bucket to be scan
     */
    if (bucketList && bucketList.length > 0) {
      bucketList.forEach((bucket, index) => {
        /**
         * S3 Bucket resources
         */
        bucket.grantReadWrite(this.scanBucketFunction);

        if (this.configuration.defaultIncomingBucket && incomingBucket) {
          this.scanBucketFunction.addEnvironment(
            "DEFAULT_INCOMING_BUCKET_NAME",
            incomingBucket?.bucketName
          );
          incomingBucket.grantReadWrite(this.scanBucketFunction);
        }

        if (this.configuration.defaultInfectedBucket && infectedBucket) {
          this.scanBucketFunction.addEnvironment(
            "DEFAULT_INFECTED_BUCKET_NAME",
            infectedBucket?.bucketName
          );

          infectedBucket.grantReadWrite(this.scanBucketFunction);
        }

        incomingQueue.grantConsumeMessages(this.scanBucketFunction);
        avNotification.infectedQueue.grantSendMessages(this.scanBucketFunction);
        avNotification.cleanQueue.grantSendMessages(this.scanBucketFunction);
      });
    } else if (incomingBucket && scannedBucket) {
      /**
       * The default flow
       * (incoming bucket and scanned bucket)
       */

      this.scanBucketFunction.addEnvironment(
        "SCANNED_BUCKET_NAME",
        scannedBucket.bucketName
      );
      this.scanBucketFunction.addEnvironment(
        "DEFAULT_INCOMING_BUCKET_NAME",
        incomingBucket.bucketName
      );

      incomingBucket.grantReadWrite(this.scanBucketFunction);
      scannedBucket.grantReadWrite(this.scanBucketFunction);
      incomingQueue.grantConsumeMessages(this.scanBucketFunction);
      incomingQueue.grantPurge(this.scanBucketFunction);
    }

    this.scanBucketFunction.addEventSource(
      new lambda_event_sources.SqsEventSource(incomingQueue)
    );

    /**
     * Outputs
     */
    new CfnOutput(this, `oInfectedQueue`, {
      description: "The infected queue ARN",
      value: incomingQueue.queueArn,
    });

    new CfnOutput(this, `oEcsLoadbalancerDns`, {
      description: "The ECS cluster load balancer task",
      value: clamavEcsPattern.loadBalancer.loadBalancerDnsName,
    });
  }
}
