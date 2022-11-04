import { Context, SQSEvent } from "aws-lambda";
import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  PutObjectCommandOutput,
  S3Client,
} from "@aws-sdk/client-s3";
import { SendMessageCommand, SQSClient } from "@aws-sdk/client-sqs";
import { Readable } from "stream";
import * as request from "request";

const s3 = new S3Client({});
const sqs = new SQSClient({});

export const handler = async (event: SQSEvent, context: Context) => {
  const { CLAMAV_ELB_HOST, SCANNED_BUCKET_NAME, INFECTED_QUEUE_URL, CUSTOM_BUCKET_LIST_STR, DEFAULT_INCOMING_BUCKET } =
    process.env;
  const { body } = event.Records[0];

  const bodyObj = JSON.parse(body);

  const { bucket, object } = bodyObj.detail;

  const getObjResponse = await s3.send(
    new GetObjectCommand({
      Bucket: bucket.name,
      Key: object.key,
    })
  );

  let buff = await streamToString(getObjResponse.Body as Readable);

  const clamAvResponse: RequestResponse = await new Promise(
    (resolve, reject) => {
      request.post(
        `http://${CLAMAV_ELB_HOST}/scan`,
        {
          json: {
            s3Object: {
              file: {
                name: object.key,
                mime: `@file/${getFileExtension(object.key)}`,
                data: buff,
              },
            },
          },
        },
        (error, response) => {
          if (response) {
            resolve(response);
          }
          if (error) {
            reject(error);
          }
        }
      );
    }
  );

  const clamAvResponseObj = clamAvResponse.body as ClamAvResponse;

  if (clamAvResponseObj && clamAvResponseObj.scanResult) {
    const { isInfected, viruses } = clamAvResponseObj.scanResult;

    if (!isInfected) {
      /**
       * Move the file to scanned bucket
       */
      let uploadOutput: PutObjectCommandOutput | undefined = undefined;

      if(CUSTOM_BUCKET_LIST_STR) {
        if(DEFAULT_INCOMING_BUCKET) {

        } else {
          uploadOutput = await s3.send(
            new PutObjectCommand({
              Bucket: SCANNED_BUCKET_NAME,
              Key: object.key,
              Tagging: `ScanStatus=${ScanStatus.Clean}`,
              Body: Buffer.from(buff, "base64"),
              ContentType: getObjResponse.ContentType,
            })
          );
        }
      } else {
        uploadOutput = await s3.send(
          new PutObjectCommand({
            Bucket: SCANNED_BUCKET_NAME,
            Key: object.key,
            Tagging: `ScanStatus=${ScanStatus.Clean}`,
            Body: Buffer.from(buff, "base64"),
            ContentType: getObjResponse.ContentType,
          })
        );
      }
      

      /**
       * Remove the file from incoming bucket
       */
      if (uploadOutput && uploadOutput.$metadata) {
        await s3.send(
          new DeleteObjectCommand({
            Bucket: bucket.name,
            Key: object.key,
          })
        );
      }
    } else {
      /**
       * Send infected file info to queue
       */
      await sqs.send(
        new SendMessageCommand({
          QueueUrl: INFECTED_QUEUE_URL,
          MessageBody: JSON.stringify({
            s3Data: bodyObj,
            viruses,
          }),
        })
      );
    }
  }
};

async function streamToString(stream: Readable): Promise<string> {
  return await new Promise((resolve, reject) => {
    const chunks: Uint8Array[] = [];
    stream.on("data", (chunk) => chunks.push(chunk));
    stream.on("error", reject);
    stream.on("end", () => resolve(Buffer.concat(chunks).toString("base64")));
  });
}

function getFileExtension(filename: string) {
  const temp = filename.split(".");

  return temp[temp.length - 1];
}

export type RequestResponse = {
  statusCode: number;
  body?: Record<string, unknown>;
};

export type ClamAvResponse = {
  message: string;
  scanResult: ClamAvScanResult;
};

export type ClamAvScanResult = {
  file: string;
  isInfected: boolean;
  viruses: string[];
};

export enum ScanStatus {
  Clean = "clean",
  Infected = "infected",
}
