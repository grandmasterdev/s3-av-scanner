import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { CleanBucketResources } from "./clean-bucket-resources";
import { EncryptionResources } from "./encryption-resources";
import { AvScannerResources } from "./av-scanner-resources";

export class S3AvScannerStack extends cdk.Stack {
  private readonly accountId: string = cdk.Stack.of(this).account;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    console.log("accountId: ", this.accountId);
    console.log("region: ", cdk.Stack.of(this).region);

    const encyptionResources = new EncryptionResources(this, `${id}-er`, {
      accountId: this.accountId,
    });

    const cleanBucketResources = new CleanBucketResources(this, `${id}-cbr`, {
      accountId: this.accountId,
      kmsKey: encyptionResources.kmsKey,
    });

    new AvScannerResources(this, `${id}-asr`, {
      bucket: cleanBucketResources.bucket,
    });
  }
}
