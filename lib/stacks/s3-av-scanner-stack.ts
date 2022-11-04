import * as cdk from "aws-cdk-lib";
import { aws_s3 as s3 } from "aws-cdk-lib";
import { Construct } from "constructs";
import { BucketResources } from "../resources/bucket-resources";
import { AvScannerResources } from "../resources/av-scanner-resources";
import { AvScannerResourcesProps, Configuration } from "../types";
import accb from "aws-cdk-config-builder";

export class S3AvScannerStack extends cdk.Stack {
  private readonly configuration;
  private readonly accountId: string = this.account;

  private readonly bucketArns: string[];

  private readonly avScannerResourcesProps: AvScannerResourcesProps;
  private readonly incomingBucketResources: BucketResources;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    
    this.configuration = accb
      .getInstance(this)
      .build<Configuration>("dev");

    console.log("configuration", this.configuration);

    this.bucketArns = (
      this.configuration as Configuration
    ).incomingBucketArnList;

    console.log("bucketArns", this.bucketArns);

    console.log("accountId: ", this.accountId);
    console.log("region: ", cdk.Stack.of(this).region);

    /**
     * Use the default configuration with incoming and scanned bucket flow when
     * bucket arns list is not present
     */
    if (!this.bucketArns) {
      this.incomingBucketResources = new BucketResources(this, `${id}-cbr`, {
        accountId: this.accountId,
        incomingBucket: true,
        scannedBucket: true,
        infectedBucket: false
      });

      this.avScannerResourcesProps = {
        incomingQueue: this.incomingBucketResources.queue,
        incomingBucket: this.incomingBucketResources.incomingBucket,
        scannedBucket: this.incomingBucketResources.scannedBucket,
      };
    } else {
      let bucketList: s3.IBucket[] = [];

      this.bucketArns.forEach((bucketArn, index) => {
        const bucket = s3.Bucket.fromBucketArn(
          this,
          `incoming-bucket-to-scan-${index}`,
          bucketArn
        );
        bucket.enableEventBridgeNotification();

        bucketList.push(
          bucket
        );
      });
      console.log('bucket list', bucketList[0].bucketArn);

      this.incomingBucketResources = new BucketResources(this, `${id}-dbr`, {
        accountId: this.accountId,
        incomingBucket: false,
        scannedBucket: false,
        infectedBucket: true,
        customIncomingBuckets: bucketList
      });

      this.avScannerResourcesProps = {
        bucketList,
        incomingQueue: this.incomingBucketResources.queue
      };
    }

    new AvScannerResources(this, `${id}-asr`, this.avScannerResourcesProps);
  }
}
