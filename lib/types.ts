import { IKey } from "aws-cdk-lib/aws-kms";
import { Bucket } from "aws-cdk-lib/aws-s3";
import { Queue } from "aws-cdk-lib/aws-sqs";

export interface BaseResourceProps {
  accountId: string;
}

export interface BucketResourcesProps extends BaseResourceProps {
  kmsKey?: IKey;
}

export interface EncryptionResourcesProps {}

export interface AvScannerResourcesProps {
  queue: Queue,
  bucket: Bucket,
  scannedBucket: Bucket
}