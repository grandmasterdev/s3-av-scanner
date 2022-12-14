import * as cdk from "aws-cdk-lib";
import { aws_s3 as s3 } from "aws-cdk-lib";
import { Construct } from "constructs";
import { BucketResources } from "../resources/bucket-resources";
import { AvScannerResources } from "../resources/av-scanner-resources";
import { AvScannerResourcesProps, Configuration } from "../types";
import { WafResources } from './../resources/waf-resources'
import accb from "aws-cdk-config-builder";

export class S3AvScannerStack extends cdk.Stack {
  private readonly configuration;
  private readonly accountId: string = this.account;

  private readonly bucketArns: string[];

  private readonly defaultIncomingBucket: boolean;
  private readonly defaultInfectedBucket: boolean;

  private readonly avScannerResourcesProps: AvScannerResourcesProps;
  private readonly bucketResources: BucketResources;
  private readonly wafResources: WafResources;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const environment = this.node.tryGetContext('environment') ?? 'dev';

    console.log('environment', environment);
    
    this.configuration = accb
      .getInstance(this)
      .build<Configuration>(environment);

    console.log("configuration", this.configuration);

    this.bucketArns = (
      this.configuration as Configuration
    ).incomingBucketArnList;

    this.defaultIncomingBucket = (this.configuration as Configuration).defaultIncomingBucket ?? false;
    this.defaultInfectedBucket = (this.configuration as Configuration).defaultInfectedBucket ?? false;

    console.log("accountId: ", this.accountId);
    console.log("region: ", cdk.Stack.of(this).region);

    /**
     * Use the default configuration with incoming and scanned bucket flow when
     * bucket arns list is not present
     */
    if (!this.bucketArns) {
      this.bucketResources = new BucketResources(this, `${id}-cbr`, {
        accountId: this.accountId,
        incomingBucket: true,
        scannedBucket: true,
        infectedBucket: false
      });

      this.avScannerResourcesProps = {
        incomingQueue: this.bucketResources.queue,
        incomingBucket: this.bucketResources.incomingBucket,
        scannedBucket: this.bucketResources.scannedBucket,
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

      this.bucketResources = new BucketResources(this, `${id}-dbr`, {
        accountId: this.accountId,
        incomingBucket: this.defaultIncomingBucket,
        scannedBucket: false,
        infectedBucket: this.defaultInfectedBucket,
        customIncomingBuckets: bucketList
      });

      this.wafResources = new WafResources(this, '${id}-waf', {});

      this.avScannerResourcesProps = {
        bucketList,
        incomingBucket: this.bucketResources.incomingBucket,
        infectedBucket: this.bucketResources.infectedBucket,
        incomingQueue: this.bucketResources.queue,
        waf: this.wafResources.webACL
      };
    }

    new AvScannerResources(this, `${id}-asr`, this.avScannerResourcesProps);
  }
}
