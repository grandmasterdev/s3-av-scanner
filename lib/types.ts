import { IKey } from "aws-cdk-lib/aws-kms";

export interface BaseResourceProps {
  accountId: string;
}

export interface BucketResourcesProps extends BaseResourceProps {
  kmsKey: IKey;
}

export interface EncryptionResourcesProps {}
