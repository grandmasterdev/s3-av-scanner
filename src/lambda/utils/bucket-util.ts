/**
 *
 * @param bucketNames
 * @returns List of custom bucket name
 */
export const getBucketNameList = (bucketNames: string) => {
  if (bucketNames !== "NONE") {
    return bucketNames.split(" , ");
  }

  return [];
};

/**
 *
 * @param bucketArn
 * @returns Bucket name
 */
export const getBucketNameFromArn = (bucketArn: string) => {
  const temp = bucketArn.split(":");

  return temp[temp.length - 1];
};
