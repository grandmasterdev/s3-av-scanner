import { IKey } from "aws-cdk-lib/aws-kms";
import { Function } from "aws-cdk-lib/aws-lambda";
import { Bucket, IBucket } from "aws-cdk-lib/aws-s3";
import { Queue } from "aws-cdk-lib/aws-sqs";
import { CfnWebACL } from "aws-cdk-lib/aws-wafv2";

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
  infectedBucket?: Bucket;
  scannedBucket?: Bucket;
  bucketList?: IBucket[];
  waf?: CfnWebACL;
}

export interface NotificationResourcesProps {
  lambda?: Function;
}

export type Configuration = {
  incomingBucketArnList: string[];
  defaultIncomingBucket: boolean;
  defaultInfectedBucket: boolean;
  scanningAgentLambda: ScanningAgentLambda;
  scanningAgentAv: ScanningAgentAv;
};

export type ScanningAgentLambda = {
  memorySize: number;
};

export type ScanningAgentAv = {
  enableWaf: boolean;
  incomingBucketLifeCycle: number;
  infectedBucketLifeCycle: number;
  scannedBucketLifeCycle: number;
};
