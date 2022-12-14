import { Readable } from "stream";

/**
 *
 * @param stream
 * @returns String converted from file stream
 */
export const streamToString = async (stream: Readable): Promise<string> => {
  return await new Promise((resolve, reject) => {
    const chunks: Uint8Array[] = [];
    stream.on("data", (chunk) => chunks.push(chunk));
    stream.on("error", reject);
    stream.on("end", () => resolve(Buffer.concat(chunks).toString("base64")));
  });
};

/**
 *
 * @param filename
 * @returns Return the file extension
 */
export const getFileExtension = (filename: string) => {
  const temp = filename.split(".");

  return temp[temp.length - 1];
};

/**
 * 
 * @param filename 
 * @returns 
 */
export const sanitizeS3FilenameForScan = (filename: string) => {
  return filename.replace(/\//g, "--");
};
