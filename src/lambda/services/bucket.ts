import {
  S3Client,
  PutObjectCommand,
  PutObjectTaggingCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { Readable } from "stream";
import { ChannelEnum } from "../factories/setup";
import { getBucketNameFromArn, getBucketNameList } from "../utils/bucket-util";
import { streamToString } from "../utils/file-util";
import { ScanStatus } from "./scanner";

const s3 = new S3Client({});

/**
 * Method to prep the file scanning process
 * @param props
 * @returns
 */
export const prepFile = async (
  props: PrepFileProps
): Promise<PrepFileResult> => {
  const { bucket, object, listOfAllowedBuckets } = props;

  const getObjResponse = await s3.send(
    new GetObjectCommand({
      Bucket: bucket.name,
      Key: object.key,
    })
  );

  console.log("getObj", getObjResponse);

  const { Metadata } = getObjResponse;

  let buff = await streamToString(getObjResponse.Body as Readable);
  let bucketNames: string[] = [];
  let destinationBucketArn: string = "";
  let destinationBucketName: string = "";

  if (listOfAllowedBuckets) {
    bucketNames = getBucketNameList(listOfAllowedBuckets);

    destinationBucketArn =
      bucketNames.filter((bucketName) => {
        return bucketName === Metadata?.["destination-bucket"];
      })[0] ?? "";

    if (destinationBucketArn) {
      destinationBucketName = getBucketNameFromArn(destinationBucketArn);
    }
  }

  await updateScanStateToBucketObject(ScanStatus.Pending, bucket.name, object.key);

  return {
    destinationBucketArn,
    destinationBucketName,
    bucket,
    bucketObject: {
      key: object.key,
      metadata: Metadata,
    },
    bucketObjectContent: buff,
    bucketObjectContentType: getObjResponse.ContentType,
  };
};

/**
 * Move scanned file to respective destination
 * @param props
 * @returns
 */
export const moveFile = async (props: MoveFileProps): Promise<void> => {
  const {
    DEFAULT_INCOMING_BUCKET_NAME,
    SCANNED_BUCKET_NAME,
    DEFAULT_INFECTED_BUCKET_NAME,
  } = process.env;

  const { channel, prepFileResult, scanStatus } = props;

  const {
    bucket,
    bucketObject,
    bucketObjectContent,
    bucketObjectContentType,
    destinationBucketName,
  } = prepFileResult;

  if (channel === ChannelEnum.CustomDestination) {
    /**
     * Get the tag updated 1st before transfer
     */
    await updateScanStateToBucketObject(scanStatus, bucket.name, bucketObject.key);

    /**
     * Transfer the object to dest bucket
     */
    const destUpload = await s3.send(
      new PutObjectCommand({
        Bucket: destinationBucketName,
        Key: bucketObject.key,
        Tagging: `ScanStatus=${scanStatus}`,
        Body: Buffer.from(bucketObjectContent, "base64"),
        ContentType: bucketObjectContentType,
        Metadata: bucketObject.metadata,
      })
    );

    console.log("[bucket]", destUpload);

    if (
      destUpload &&
      destUpload.$metadata.httpStatusCode &&
      destUpload.$metadata.httpStatusCode === 200
    ) {
      await s3.send(
        new DeleteObjectCommand({
          Bucket: getBucketNameFromArn(DEFAULT_INCOMING_BUCKET_NAME),
          Key: bucketObject.key,
        })
      );
    }
  } else if (channel === ChannelEnum.CustomIncoming) {
    if (scanStatus === ScanStatus.Infected) {
      const infectedUpload = await s3.send(
        new PutObjectCommand({
          Bucket: DEFAULT_INFECTED_BUCKET_NAME,
          Key: bucketObject.key,
          Tagging: `ScanStatus=${scanStatus}`,
          Body: Buffer.from(bucketObjectContent, "base64"),
          ContentType: bucketObjectContentType,
          Metadata: bucketObject.metadata,
        })
      );

      if (
        infectedUpload &&
        infectedUpload.$metadata.httpStatusCode &&
        infectedUpload.$metadata.httpStatusCode === 200
      ) {
        await s3.send(
          new DeleteObjectCommand({
            Bucket: DEFAULT_INCOMING_BUCKET_NAME,
            Key: bucketObject.key,
          })
        );
      }
    }

    if (scanStatus === ScanStatus.Clean) {
      await updateScanStateToBucketObject(scanStatus, bucket.name, bucketObject.key)
    }
  } else {
    if (scanStatus === ScanStatus.Clean) {
      await updateScanStateToBucketObject(scanStatus, SCANNED_BUCKET_NAME ?? bucket.name, bucketObject.key)
    }

    if (scanStatus === ScanStatus.Infected) {
      await s3.send(
        new PutObjectCommand({
          Bucket: DEFAULT_INFECTED_BUCKET_NAME,
          Key: bucketObject.key,
          Tagging: `ScanStatus=${ScanStatus.Infected}`,
          Body: Buffer.from(bucketObjectContent, "base64"),
          ContentType: bucketObjectContentType,
          Metadata: bucketObject.metadata,
        })
      );
    }
  }
};

const updateScanStateToBucketObject = async (status: ScanStatus, bucketName: string, objectKey: string) => {
  await s3.send(
    new PutObjectTaggingCommand({
      Bucket: bucketName,
      Key: objectKey,
      Tagging: {
        TagSet: [
          {
            Key: "ScanStatus",
            Value: status,
          },
        ],
      },
    })
  );
}

export interface MoveFileProps {
  channel: ChannelEnum;
  destinationBucketName?: string;
  prepFileResult: PrepFileResult;
  scanStatus: ScanStatus;
}

export interface PrepFileProps {
  bucket: Readonly<{
    name: string;
  }>;
  object: Record<string, string>;
  listOfAllowedBuckets?: string;
}

export type PrepFileResult = {
  destinationBucketArn?: string;
  destinationBucketName?: string;
  bucket: Readonly<{ name: string }>;
  bucketObject: Readonly<{
    key: string;
    metadata?: Record<string, string>;
  }>;
  bucketObjectContent: string;
  bucketObjectContentType: string | undefined;
};
