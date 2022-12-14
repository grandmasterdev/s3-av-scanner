import * as cut from "./../../../../src/lambda/services/bucket";
import { mocked } from "jest-mock";
import { S3Client } from "@aws-sdk/client-s3";
import {
  getBucketNameFromArn,
  getBucketNameList,
} from "../../../../src/lambda/utils/bucket-util";

jest.mock("@aws-sdk/client-s3");
jest.mock("./../../../../src/lambda/utils/file-util");
jest.mock("./../../../../src/lambda/utils/bucket-util");

const mockedGetBucketNameList = mocked(getBucketNameList);
const mockedGetBucketNameFromArn = mocked(getBucketNameFromArn);

describe("prepFile tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("it should return prep file result", async () => {
    mockedGetBucketNameList.mockReturnValue(["jest-dest-bucket"]);
    mockedGetBucketNameFromArn.mockReturnValue("jest-dest-bucket");

    const s3 = new S3Client({});
    const mockedS3 = mocked(s3);

    mockedS3.send.mockResolvedValue({
      Body: { Metadata: [{ "destination-bucket": "jest-dest-bucket" }] },
    } as never);

    const result = await cut.prepFile({
      bucket: {
        name: "jest-bucket",
      },
      object: {
        key: "jest-filename.gif"
      },
      listOfAllowedBuckets: "jest-dest-bucket",
    });

    expect(result).toStrictEqual({
      bucket: {
        name: "jest-bucket",
      },
      bucketObject: {
        key: "jest-filename.gif",
        metadata: undefined,
      },
      bucketObjectContent: undefined,
      bucketObjectContentType: undefined,
      destinationBucketArn: "",
      destinationBucketName: "",
    });
  });
});
