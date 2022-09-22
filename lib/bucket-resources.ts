import { Construct } from "constructs";
import {
  aws_s3 as s3,
  aws_sqs as sqs,
  aws_events as events,
  aws_events_targets as event_targets,
  aws_logs as logs,
  Duration
} from "aws-cdk-lib";
import { BucketResourcesProps } from "./types";

export class BucketResources extends Construct {
  private accountId: string = "";
  private bucketName: string = "";
  private scannedBucketName: string = "";

  private readonly queueName: string = "process-queue";

  public bucket: s3.Bucket;
  public scannedBucket: s3.Bucket;
  public queue: sqs.Queue;

  constructor(scope: Construct, id: string, props: BucketResourcesProps) {
    super(scope, id);

    this.accountId = props.accountId;
    this.bucketName = "incoming-bucket-" + this.accountId;
    this.scannedBucketName = "scanned-bucket-" + this.accountId;

    /**
     * S3 bucket resource and policy
     */
    this.bucket = new s3.Bucket(this, `${id}-clean-bucket`, {
      bucketName: this.bucketName,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      eventBridgeEnabled: true
    });

    /**
     * S3 bucket resource and policy
     */
     this.scannedBucket = new s3.Bucket(this, `${id}-scanned-bucket`, {
      bucketName: this.scannedBucketName,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      eventBridgeEnabled: false
    });

    /**
     * Bucket event queue resource
     */
    this.queue = new sqs.Queue(this, `${id}-process-queue`, {
      queueName: this.queueName,
      retentionPeriod: Duration.days(7),
    });

    /**
     * Event log resource
     */
    const cleanBucketEventLog = new logs.LogGroup(this, `${id}-event-log`, {
      logGroupName: `/aws/events/${this.bucketName}`,
      retention: logs.RetentionDays.ONE_DAY
    })

    /**
     * S3 Bucket event resources
     */
    new events.Rule(
      this,
      `${id}-clean-bucket-event-rule`,
      {
        ruleName: `${this.bucketName}-event-rule`,
        enabled: true,
        eventPattern: {
          source: ["aws.s3"],
          detailType: ["Object Created"],
          detail: {
            bucket: {
              name: [this.bucketName],
            },
          }
        },
        targets: [
          new event_targets.SqsQueue(this.queue),
          new event_targets.CloudWatchLogGroup(cleanBucketEventLog)
        ]
      }
    );
  }
}
