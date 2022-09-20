import { IKey } from "aws-cdk-lib/aws-kms";
import { Bucket } from "aws-cdk-lib/aws-s3";

export interface BaseResourceProps {
  accountId: string;
}

export interface BucketResourcesProps extends BaseResourceProps {
  kmsKey: IKey;
}

export interface EncryptionResourcesProps {}

export interface AvScannerResourcesProps {
  bucket: Bucket;
}