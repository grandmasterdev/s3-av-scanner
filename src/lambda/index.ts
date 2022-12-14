import { Context, SQSEvent } from "aws-lambda";
import { scanObjectWithAv, ScanStatus } from "./services/scanner";
import { moveFile, prepFile } from "./services/bucket";
import { ChannelEnum, Setup } from "./factories/setup";
import { notify } from "./services/notification";

const setup = new Setup();

setup.makeInfraConfiguration();

export const handler = async (event: SQSEvent, context: Context) => {
  const {
    CUSTOM_BUCKET_LIST_STR,
  } = process.env;
  const { body } = event.Records[0];

  const bodyObj = JSON.parse(body);

  const { bucket, object } = bodyObj.detail;

  const prepBucketObject = await prepFile({
    bucket,
    object,
    listOfAllowedBuckets: CUSTOM_BUCKET_LIST_STR
  });

  console.log('[prepBucketObject]', prepBucketObject);
  
  const clamAvResponseObj = await scanObjectWithAv({
    object,
    objectBufferStr: prepBucketObject.bucketObjectContent
  });

  console.log('[clamAvResponse] response: ', clamAvResponseObj);

  if (clamAvResponseObj && clamAvResponseObj.scanResult) {
    const { isInfected, viruses } = clamAvResponseObj.scanResult;

    if (!isInfected) {
      await moveFile({
        channel: setup.channel,
        prepFileResult: prepBucketObject,
        scanStatus: ScanStatus.Clean
      })

      /**
       * Send infected file info to queue
       */
      await notify({
        eventObj: bodyObj,
        status: ScanStatus.Clean
      })
    } else {
      /**
       * Move infected objects to default infected bucket
       */
      await moveFile({
        channel: ChannelEnum.Default,
        prepFileResult: prepBucketObject,
        scanStatus: ScanStatus.Infected
      })

      /**
       * Send infected file info to queue
       */
      await notify({
        eventObj: bodyObj,
        viruses,
        status: ScanStatus.Infected
      })
    }
  }
};
