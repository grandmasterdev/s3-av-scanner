import { SendMessageCommand, SQSClient } from "@aws-sdk/client-sqs";
import { ScanStatus } from "./scanner";

const sqs = new SQSClient({});

/**
 * Send notification to sqs or sns or both
 * @param props 
 */
export const notify = async (props: NotifyProps) => {
  const { INFECTED_QUEUE_URL, CLEAN_QUEUE_URL } = process.env;
  const { status, eventObj, viruses } = props;

  if(status === ScanStatus.Infected) {
    await sqs.send(
        new SendMessageCommand({
          QueueUrl: INFECTED_QUEUE_URL,
          MessageBody: JSON.stringify({
            s3Data: eventObj,
            viruses,
          }),
        })
      );
  } else {
    await sqs.send(
        new SendMessageCommand({
          QueueUrl: CLEAN_QUEUE_URL,
          MessageBody: JSON.stringify({
            s3Data: eventObj
          }),
        })
      );
  }
};

export interface NotifyProps {
    status: ScanStatus,
    eventObj: unknown,
    viruses?: unknown[]
}