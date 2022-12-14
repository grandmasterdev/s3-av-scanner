export type RequestResponse<T> = {
  statusCode: number;
  body?: T;
};
