import { Construct } from "constructs";
import {
  aws_s3 as s3,
  aws_sqs as sqs,
  aws_events as events,
  aws_events_targets as event_targets,
  aws_logs as logs,
  aws_kms as kms,
  Duration,
  aws_iam as iam,
} from "aws-cdk-lib";
import { BucketResourcesProps } from "./types";

export class CleanBucketResources extends Construct {
  private accountId: string = "";
  private bucketName: string = "";
  private kmsKey: kms.IKey;

  private readonly queueName: string = "process-queue";

  constructor(scope: Construct, id: string, props: BucketResourcesProps) {
    super(scope, id);

    this.accountId = props.accountId;
    this.bucketName = "clean-bucket-" + this.accountId;
    this.kmsKey = props.kmsKey;

    /**
     * S3 bucket resource and policy
     */
    const bucket = new s3.Bucket(this, `${id}-clean-bucket`, {
      bucketName: this.bucketName,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      eventBridgeEnabled: true
    });

    // const bucketPolicy = new s3.BucketPolicy(
    //   this,
    //   `${id}-clean-bucket-policy`,
    //   {
    //     bucket
    //   }
    // );
    // bucketPolicy.document.addStatements(
    //   new iam.PolicyStatement({
    //     effect: iam.Effect.DENY,
    //     resources: [`${bucket.bucketArn}/*`],
    //     actions: ["s3:*"],
    //     principals: [new iam.AnyPrincipal()]
    //   })
    // );
    // bucketPolicy.document.addStatements(
    //   new iam.PolicyStatement({
    //     effect: iam.Effect.ALLOW,
    //     resources: [`${bucket.bucketArn}/*`],
    //     actions: ["s3:*"],
    //     principals: [new iam.AnyPrincipal()]
    //   })
    // );

    /**
     * Bucket event queue resource
     */
    const processQueue = new sqs.Queue(this, `${id}-process-queue`, {
      queueName: this.queueName,
      retentionPeriod: Duration.days(7),
      encryption: sqs.QueueEncryption.KMS,
      encryptionMasterKey: this.kmsKey
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
    const cleanBucketEventRule = new events.Rule(
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
          new event_targets.SqsQueue(processQueue),
          new event_targets.CloudWatchLogGroup(cleanBucketEventLog)
        ]
      }
    );

    this.kmsKey.grantEncrypt(new iam.ServicePrincipal('events.amazonaws.com'))

  }
}
