import { ChannelEnum } from "../../../../src/lambda/factories/setup";

describe("factories setup tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("it should return channel object", () => {
    process.env = {
      CLAMAV_ELB_HOST: "clamav-elb-host",
      CLEAN_QUEUE_URL: "clean-sqs-url",
      INFECTED_QUEUE_URL: "infected-sqs-url",
      DEFAULT_INCOMING_BUCKET: "true",
      DEFAULT_INFECTED_BUCKET: "false",
      DEFAULT_INCOMING_BUCKET_NAME: "incoming",
      DEFAULT_INFECTED_BUCKET_NAME: "undefined",
      CUSTOM_BUCKET_LIST_STR: "bucket-1",
    };
    const cut = require("./../../../../src/lambda/factories/setup");

    const obj = new cut.Setup();
    obj.makeInfraConfiguration();

    expect(obj.channel).toBe(ChannelEnum.CustomDestination);
  });

  test("it should return channel default if default incoming is true and custom bucket list is NONE", () => {
    process.env = {
      CLAMAV_ELB_HOST: "clamav-elb-host",
      CLEAN_QUEUE_URL: "clean-sqs-url",
      INFECTED_QUEUE_URL: "infected-sqs-url",
      DEFAULT_INCOMING_BUCKET: "true",
      DEFAULT_INFECTED_BUCKET: "false",
      DEFAULT_INCOMING_BUCKET_NAME: "incoming",
      DEFAULT_INFECTED_BUCKET_NAME: "undefined",
      CUSTOM_BUCKET_LIST_STR: "NONE",
    };
    const cut = require("./../../../../src/lambda/factories/setup");

    const obj = new cut.Setup();
    obj.makeInfraConfiguration();

    expect(obj.channel).toBe(ChannelEnum.Default);
  });

  test("it should return channel custom incoming if default incoming is false and custom bucket list is not NONE and default infected is true", () => {
    process.env = {
      CLAMAV_ELB_HOST: "clamav-elb-host",
      CLEAN_QUEUE_URL: "clean-sqs-url",
      INFECTED_QUEUE_URL: "infected-sqs-url",
      DEFAULT_INCOMING_BUCKET: "false",
      DEFAULT_INFECTED_BUCKET: "true",
      DEFAULT_INCOMING_BUCKET_NAME: "incoming",
      DEFAULT_INFECTED_BUCKET_NAME: "undefined",
      CUSTOM_BUCKET_LIST_STR: "bucket-1 , bucket-2",
    };
    const cut = require("./../../../../src/lambda/factories/setup");

    const obj = new cut.Setup();
    obj.makeInfraConfiguration();

    expect(obj.channel).toBe(ChannelEnum.CustomIncoming);
  });
});
