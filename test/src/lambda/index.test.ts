import { mocked } from "jest-mock";
import { SQSEvent } from "aws-lambda";
import * as cut from "./../../../src/lambda";
import { scanObjectWithAv } from "./../../../src/lambda/services/scanner";
import { moveFile, prepFile } from "./../../../src/lambda/services/bucket";
import { notify } from './../../../src/lambda/services/notification';
import { assert } from "console";

jest.mock("./../../../src/lambda/factories/setup");
jest.mock("./../../../src/lambda/services/bucket");
jest.mock("./../../../src/lambda/services/notification");
jest.mock("./../../../src/lambda/services/scanner");

const mockedScanObjectWithAv = mocked(scanObjectWithAv);
const mockedPrepFile = mocked(prepFile);
const mockedMoveFile = mocked(moveFile);
const mockedNotify = mocked(notify);

const mockedEvent = {
  Records: [
    {
      body: JSON.stringify({
        version: "0",
        id: "585eea51-dfad-b30e-298d-9d3dfd7e4994",
        "detail-type": "Object Created",
        source: "aws.s3",
        account: "060846019663",
        time: "2022-12-02T04:06:45Z",
        region: "eu-west-1",
        resources: ["arn:aws:s3:::incoming-bucket-060846019663"],
        detail: {
          version: "0",
          bucket: {
            name: "incoming-bucket-060846019663",
          },
          object: {
            key: "swim-timmy-learning-to-swim-40014332.png",
            size: 174868,
            etag: "dfe9981e10f4b759356ef5ad2ef1b141",
            sequencer: "00638979D54D6B57BD",
          },
          "request-id": "N740SC2YR45QZ56V",
          requester: "060846019663",
          "source-ip-address": "86.48.10.7",
          reason: "PutObject",
        },
      }),
      messageId: "mock-message-id",
    },
  ],
};

describe("lambda scanner function tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockedPrepFile.mockResolvedValue({
      destinationBucketArn: "",
      destinationBucketName: "",
      bucket: {
        name: 'jest-bucket'
      },
      bucketObject: {
        key: "jest-file.gif",
      },
      bucketObjectContent: "",
      bucketObjectContentType: "gif",
    });

    mockedScanObjectWithAv.mockResolvedValue({
      scanResult: {
        file: 'test.gif',
        viruses: [],
        isInfected: false
      }
    })
  });

  test("should execute properly", async () => {
    await cut.handler(mockedEvent as SQSEvent, {} as any);

    assert(4);
    expect(mockedPrepFile).toHaveBeenCalledTimes(1);
    expect(mockedScanObjectWithAv).toHaveBeenCalledTimes(1);
    expect(mockedMoveFile).toHaveBeenCalledTimes(1);
    expect(mockedNotify).toHaveBeenCalledTimes(1);
  });
});
