export {};

declare global {
  namespace NodeJS {
    interface ProcessEnv {
        CLAMAV_ELB_HOST: string;
        INFECTED_QUEUE_URL: string;
        CLEAN_QUEUE_URL: string;
        CUSTOM_BUCKET_LIST_STR: string;
        DEFAULT_INCOMING_BUCKET: string;
        DEFAULT_INFECTED_BUCKET: string;
    }
  }
}