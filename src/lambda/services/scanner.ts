import * as request from "request";
import { promisify } from "util";
import { getFileExtension, sanitizeS3FilenameForScan } from "../utils/file-util";
import { RequestResponse } from "./../../types";

const pRequestPost = promisify(request.post);

/**
 * Scan file with the AV agent
 * @param props 
 * @returns 
 */
export const scanObjectWithAv = async (
  props: ScanObjectWithAvProps
): Promise<ScannerOutput> => {
  const { CLAMAV_ELB_HOST } = process.env;
  const { object, objectBufferStr } = props;

  const clamAvResponse: RequestResponse<ClamAvResponse> = await pRequestPost({
    url: `http://${CLAMAV_ELB_HOST}/scan`,
    json: {
      s3Object: {
        file: {
          name: sanitizeS3FilenameForScan(object.key),
          mime: `@file/${getFileExtension(object.key)}`,
          data: objectBufferStr,
        },
      },
    },
  });

  console.log('[scanner] clamAvResponse: ', clamAvResponse)

  const { body } = clamAvResponse;

  if(!body) {
    throw new Error('[scanObjectWithAv] Missing body from ClamAV Response')
  }

  return {
    scanResult: body.scanResult
  };
};

export interface ScanObjectWithAvProps {
  object: Record<string, string>;
  objectBufferStr: string;
}

export type ClamAvResponse = {
  message?: string;
  scanResult: ClamAvScanResult;
};

export type ClamAvScanResult = {
  file: string;
  isInfected: boolean;
  viruses: string[];
};

export type ScannerOutput = {
  scanResult: ClamAvScanResult;
}

export enum ScanStatus {
  Clean = "clean",
  Infected = "infected",
  Pending = "pending"
}
