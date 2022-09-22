import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { BucketResources } from "./bucket-resources";
import { AvScannerResources } from "./av-scanner-resources";

export class S3AvScannerStack extends cdk.Stack {
  private readonly accountId: string =  this.account;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    console.log("accountId: ", this.accountId);
    console.log("region: ", cdk.Stack.of(this).region);


    const incomingBucketResources = new BucketResources(this, `${id}-cbr`, {
      accountId: this.accountId,
    });

    new AvScannerResources(this, `${id}-asr`, {
      queue: incomingBucketResources.queue,
      bucket: incomingBucketResources.bucket,
      scannedBucket: incomingBucketResources.scannedBucket
    });
  }
}
