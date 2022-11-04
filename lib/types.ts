import { IKey } from "aws-cdk-lib/aws-kms";
import { Bucket, IBucket } from "aws-cdk-lib/aws-s3";
import { Queue } from "aws-cdk-lib/aws-sqs";

export interface BaseResourceProps {
  accountId: string;
}

export interface BucketResourcesProps extends BaseResourceProps {
  kmsKey?: IKey;
  incomingBucket: boolean;
  scannedBucket: boolean;
  infectedBucket: boolean;
  customIncomingBuckets?: IBucket[];
}

export interface AvScannerResourcesProps {
  incomingQueue?: Queue;
  incomingBucket?: Bucket;
  scannedBucket?: Bucket;
  bucketList?: IBucket[];
}

export interface NotificationResourcesProps {
  
}

export type Configuration = {
  incomingBucketArnList: string[],
  defaultIncomingBucket: boolean,
  scanningAgentLambda: ScanningAgentLambda,
}

export type ScanningAgentLambda = {
  memorySize: number
}