import { Construct } from "constructs";
import {
  aws_s3 as s3,
  aws_sqs as sqs,
  aws_events as events,
  aws_events_targets as event_targets,
  aws_logs as logs,
  Duration,
} from "aws-cdk-lib";
import { BucketResourcesProps } from "./../types";

export class BucketResources extends Construct {
  private accountId: string = "";
  private incomingBucketName: string = "";
  private scannedBucketName: string = "";
  private infectedBucketName: string = "";

  private readonly queueName: string = "process-queue";

  public incomingBucket: s3.Bucket;
  public scannedBucket: s3.Bucket;
  public infectedBucket: s3.Bucket;
  public queue: sqs.Queue;

  constructor(scope: Construct, id: string, props: BucketResourcesProps) {
    super(scope, id);

    const {
      accountId,
      incomingBucket,
      scannedBucket,
      infectedBucket,
      customIncomingBuckets,
    } = props;

    this.accountId = accountId;
    this.incomingBucketName = "incoming-bucket-" + this.accountId;
    this.scannedBucketName = "scanned-bucket-" + this.accountId;
    this.infectedBucketName = "infected-bucket-" + this.accountId;

    /**
     * S3 bucket resource and policy
     */
    if (incomingBucket) {
      this.incomingBucket = new s3.Bucket(this, `${id}-clean-bucket`, {
        bucketName: this.incomingBucketName,
        encryption: s3.BucketEncryption.S3_MANAGED,
        blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
        eventBridgeEnabled: true,
        lifecycleRules: [
          {
            enabled: true,
            expiration: Duration.days(30)
          }
        ]
      });
    }

    if (scannedBucket) {
      this.scannedBucket = new s3.Bucket(this, `${id}-scanned-bucket`, {
        bucketName: this.scannedBucketName,
        encryption: s3.BucketEncryption.S3_MANAGED,
        blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
        eventBridgeEnabled: false,
        lifecycleRules: [
          {
            enabled: true,
            expiration: Duration.days(7),
          },
        ],
      });
    }

    if (infectedBucket) {
      this.infectedBucket = new s3.Bucket(this, `${id}-infected-bucket`, {
        bucketName: this.infectedBucketName,
        encryption: s3.BucketEncryption.S3_MANAGED,
        blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
        eventBridgeEnabled: false,
        lifecycleRules: [
          {
            enabled: true,
            expiration: Duration.days(7),
          },
        ],
      });
    }

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
    const incomingBucketEventLog = new logs.LogGroup(this, `${id}-event-log`, {
      logGroupName: `/aws/events/${this.incomingBucketName}`,
      retention: logs.RetentionDays.ONE_DAY,
    });

    /**
     * S3 Bucket event resources
     */
    const eventBucketNamePatternList: string[] = incomingBucket
      ? [this.incomingBucketName]
      : customIncomingBuckets ? this.getListOfCustomBucketNames(customIncomingBuckets) : [];

    new events.Rule(this, `${id}-s3-bucket-av-event-rule`, {
      ruleName: `s3-bucket-av-event-rule`,
      enabled: true,
      eventPattern: {
        source: ["aws.s3"],
        detailType: ["Object Created"],
        detail: {
          bucket: {
            name: eventBucketNamePatternList,
          },
        },
      },
      targets: [
        new event_targets.SqsQueue(this.queue),
        new event_targets.CloudWatchLogGroup(incomingBucketEventLog),
      ],
    });
  }

  private getListOfCustomBucketNames(bucketList: s3.IBucket[]) {
    let bucketNameList: string[] = [];

    bucketList.forEach((bucket) => {
      bucketNameList.push(bucket.bucketName);
    });

    return bucketNameList;
  }
}
