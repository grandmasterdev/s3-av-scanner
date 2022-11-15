import * as cdk from "aws-cdk-lib";
import { Template, Match } from "aws-cdk-lib/assertions";
import * as S3AvScanner from "../../../lib/stacks/s3-av-scanner-stack";
import { mocked } from "jest-mock";
import accb from "aws-cdk-config-builder";

jest.mock("aws-cdk-config-builder", () => {
  return {
    getInstance: jest.fn(() => {
      return {
        build: () => {
          return {
            incomingBucketArnList: null,
            defaultIncomingBucket: false,
            scanningAgentLambda: {
              memorySize: 128,
            },
          };
        },
      };
    }),
  };
});

const mockedAccb = mocked(accb, { shallow: false });

describe("create default incoming bucket and clean bucket", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    (mockedAccb.getInstance as any).mockImplementation(() => {
      return {
        build: () => {
          return {
            incomingBucketArnList: null,
            defaultIncomingBucket: false,
            scanningAgentLambda: {
              memorySize: 129,
            },
          };
        },
      };
    });
  });

  test("Process SQS Queue Created", () => {
    const app = new cdk.App();
    // WHEN
    const stack = new S3AvScanner.S3AvScannerStack(app, "MyTestStack");
    // THEN
    const template = Template.fromStack(stack);

    template.hasResourceProperties("AWS::SQS::Queue", {
      QueueName: "process-queue",
    });
    template.resourcePropertiesCountIs(
      "AWS::SQS::Queue",
      {
        QueueName: "process-queue",
      },
      1
    );
  });

  test("Infected SQS Queue Created", () => {
    const app = new cdk.App();
    // WHEN
    const stack = new S3AvScanner.S3AvScannerStack(app, "MyTestStack");
    // THEN
    const template = Template.fromStack(stack);

    template.hasResourceProperties("AWS::SQS::Queue", {
      QueueName: "av-infected-queue",
    });
    template.resourcePropertiesCountIs(
      "AWS::SQS::Queue",
      {
        QueueName: "av-infected-queue",
      },
      1
    );
  });

  test("Incoming S3 Bucket Created", () => {
    const app = new cdk.App();
    // WHEN
    const stack = new S3AvScanner.S3AvScannerStack(app, "MyTestStack");
    // THEN
    const template = Template.fromStack(stack);

    template.resourcePropertiesCountIs(
      "AWS::S3::Bucket",
      {
        BucketName: {
          "Fn::Join": [
            "",
            [
              "incoming-bucket-",
              {
                Ref: "AWS::AccountId",
              },
            ],
          ],
        },
      },
      1
    );
    template.hasResourceProperties("AWS::S3::Bucket", {
      BucketName: {
        "Fn::Join": [
          "",
          [
            "incoming-bucket-",
            {
              Ref: "AWS::AccountId",
            },
          ],
        ],
      },
    });
  });

  test("Scanned S3 Bucket Created", () => {
    const app = new cdk.App();
    // WHEN
    const stack = new S3AvScanner.S3AvScannerStack(app, "MyTestStack");
    // THEN
    const template = Template.fromStack(stack);

    template.resourcePropertiesCountIs(
      "AWS::S3::Bucket",
      {
        BucketName: {
          "Fn::Join": [
            "",
            [
              "scanned-bucket-",
              {
                Ref: "AWS::AccountId",
              },
            ],
          ],
        },
      },
      1
    );
    template.hasResourceProperties("AWS::S3::Bucket", {
      BucketName: {
        "Fn::Join": [
          "",
          [
            "scanned-bucket-",
            {
              Ref: "AWS::AccountId",
            },
          ],
        ],
      },
    });
  });

  test("Infected S3 Bucket Not Created", () => {
    const app = new cdk.App();
    // WHEN
    const stack = new S3AvScanner.S3AvScannerStack(app, "MyTestStack");
    // THEN
    const template = Template.fromStack(stack);

    template.resourcePropertiesCountIs(
      "AWS::S3::Bucket",
      {
        BucketName: {
          "Fn::Join": [
            "",
            [
              "infected-bucket-",
              {
                Ref: "AWS::AccountId",
              },
            ],
          ],
        },
      },
      0
    );
  });
});

describe.only("create custom incoming bucket and default infected bucket", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    (mockedAccb.getInstance as any).mockImplementation(() => {
      return {
        build: () => {
          return {
            incomingBucketArnList: [
              "arn:aws:s3:::somebucket-1",
              "arn:aws:s3:::somebucket-2",
              "arn:aws:s3:::somebucket-3",
            ],
            defaultIncomingBucket: false,
            scanningAgentLambda: {
              memorySize: 128,
            },
          };
        },
      };
    });
  });

  test("Process SQS Queue Created", () => {
    const app = new cdk.App();
    // WHEN
    const stack = new S3AvScanner.S3AvScannerStack(app, "MyTestStack");
    // THEN
    const template = Template.fromStack(stack);

    template.hasResourceProperties("AWS::SQS::Queue", {
      QueueName: "process-queue",
    });
    template.resourcePropertiesCountIs(
      "AWS::SQS::Queue",
      {
        QueueName: "process-queue",
      },
      1
    );
  });

  test("Infected SQS Queue Created", () => {
    const app = new cdk.App();
    // WHEN
    const stack = new S3AvScanner.S3AvScannerStack(app, "MyTestStack");
    // THEN
    const template = Template.fromStack(stack);

    template.hasResourceProperties("AWS::SQS::Queue", {
      QueueName: "av-infected-queue",
    });
    template.resourcePropertiesCountIs(
      "AWS::SQS::Queue",
      {
        QueueName: "av-infected-queue",
      },
      1
    );
  });

  test("Incoming S3 Bucket Not Created", () => {
    const app = new cdk.App();
    // WHEN
    const stack = new S3AvScanner.S3AvScannerStack(app, "MyTestStack");
    // THEN
    const template = Template.fromStack(stack);

    template.resourcePropertiesCountIs(
      "AWS::S3::Bucket",
      {
        BucketName: {
          "Fn::Join": [
            "",
            [
              "incoming-bucket-",
              {
                Ref: "AWS::AccountId",
              },
            ],
          ],
        },
      },
      0
    );
  });

  test("Scanned S3 Bucket Not Created", () => {
    const app = new cdk.App();
    // WHEN
    const stack = new S3AvScanner.S3AvScannerStack(app, "MyTestStack");
    // THEN
    const template = Template.fromStack(stack);

    template.resourcePropertiesCountIs(
      "AWS::S3::Bucket",
      {
        BucketName: {
          "Fn::Join": [
            "",
            [
              "scanned-bucket-",
              {
                Ref: "AWS::AccountId",
              },
            ],
          ],
        },
      },
      0
    );
  });

  test("Infected S3 Bucket Not Created", () => {
    const app = new cdk.App();
    // WHEN
    const stack = new S3AvScanner.S3AvScannerStack(app, "MyTestStack");
    // THEN
    const template = Template.fromStack(stack);

    template.resourcePropertiesCountIs(
      "AWS::S3::Bucket",
      {
        BucketName: {
          "Fn::Join": [
            "",
            [
              "infected-bucket-",
              {
                Ref: "AWS::AccountId",
              },
            ],
          ],
        },
      },
      1
    );
  });

  test("Custom Buckets Event Created", () => {
    const app = new cdk.App();
    // WHEN
    const stack = new S3AvScanner.S3AvScannerStack(app, "MyTestStack");
    // THEN
    const template = Template.fromStack(stack);

    template.resourcePropertiesCountIs("AWS::Events::Rule", {
      EventPattern: {
        source: ["aws.s3"],
        "detail-type": ["Object Created"],
        detail: {
          bucket: {
            name: ["somebucket-1", "somebucket-2", "somebucket-3"],
          },
        },
      },
      Name: "s3-bucket-av-event-rule"
    }, 1)

    template.hasResourceProperties("AWS::Events::Rule", {
      EventPattern: {
        source: ["aws.s3"],
        "detail-type": ["Object Created"],
        detail: {
          bucket: {
            name: ["somebucket-1", "somebucket-2", "somebucket-3"],
          },
        },
      },
      Name: "s3-bucket-av-event-rule",
      State: "ENABLED",
      Targets: [
        {
          Arn: {
            "Fn::GetAtt": [
              "MyTestStackdbrMyTestStackdbrprocessqueue15764F34",
              "Arn",
            ],
          },
          Id: "Target0",
        },
        {
          Arn: {
            "Fn::Join": [
              "",
              [
                "arn:",
                {
                  Ref: "AWS::Partition",
                },
                ":logs:",
                {
                  Ref: "AWS::Region",
                },
                ":",
                {
                  Ref: "AWS::AccountId",
                },
                ":log-group:",
                {
                  Ref: "MyTestStackdbrMyTestStackdbreventlogAF1E1A16",
                },
              ],
            ],
          },
          Id: "Target1",
        },
      ],
    });
  });
});
