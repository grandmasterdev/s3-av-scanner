import { Duration, aws_sqs as sqs, CfnOutput } from "aws-cdk-lib";
import { Construct } from "constructs";
import { NotificationResourcesProps } from "../types";

export class NoficationResources extends Construct {
  private readonly infectedQueueName: string = "av-infected-queue";
  private readonly cleanQueueName: string = "av-clean-queue";

  public infectedQueue: sqs.Queue;
  public cleanQueue: sqs.Queue;

  constructor(scope: Construct, id: string, props: NotificationResourcesProps) {
    super(scope, id);

    /**
     * Notification resources
     */
    this.infectedQueue = new sqs.Queue(this, `${id}-infected-queue`, {
      queueName: this.infectedQueueName,
      retentionPeriod: Duration.days(7),
    });
    this.cleanQueue = new sqs.Queue(this, `${id}-clean-queue`, {
      queueName: this.cleanQueueName,
      retentionPeriod: Duration.days(7),
    });

    new CfnOutput(this, `oCleanQueue`, {
      description: "The clean queue ARN",
      value: this.cleanQueue.queueArn,
    });
  }
}
