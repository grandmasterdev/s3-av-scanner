import { Readable } from "stream";
import { readFileSync } from "fs";
import * as cut from "./../../../../src/lambda/utils/file-util";

const mockReadable = () => {
  const buff = readFileSync(
    __dirname + "/__mocks__/readable-mock-file.txt",
    {}
  );

  return Readable.from(buff);
};

describe("getFileExtension tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("it should return gif if filename is something.gif", () => {
    const result = cut.getFileExtension("something.gif");

    expect(result).toBe("gif");
  });
});

describe("streamToString tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("it should return file stream in string", async () => {
    const result = await cut.streamToString(mockReadable());

    expect(result).toBe("bW9jayBjb250ZW50IGZvciB0ZXN0aW5n");
  });
});

describe("sanitizeS3FilenameForScan tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("it should return filename replacing / with --", () => {
    const result = cut.sanitizeS3FilenameForScan(
      "012-222-asd-111/random-stuff/filename.txt"
    );

    expect(result).toBe("012-222-asd-111--random-stuff--filename.txt");
  });
});
