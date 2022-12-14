/**
 * Prep the service with the right flow
 */
export class Setup {
  private readonly environment: NodeJS.ProcessEnv;

  private _channel: ChannelEnum;

  constructor() {
    this.environment = process.env;
    this._channel = ChannelEnum.Default;
  }

  public get channel() {
    return this._channel;
  }

  public makeInfraConfiguration() {
    const {
      CUSTOM_BUCKET_LIST_STR,
      DEFAULT_INCOMING_BUCKET,
      DEFAULT_INFECTED_BUCKET,
    } = this.environment;

    if (
      DEFAULT_INFECTED_BUCKET &&
      DEFAULT_INFECTED_BUCKET !== "false" &&
      CUSTOM_BUCKET_LIST_STR &&
      CUSTOM_BUCKET_LIST_STR !== "NONE"
    ) {
      this._channel = ChannelEnum.CustomIncoming;
    } else if (
      DEFAULT_INCOMING_BUCKET &&
      DEFAULT_INCOMING_BUCKET !== "false" &&
      CUSTOM_BUCKET_LIST_STR &&
      CUSTOM_BUCKET_LIST_STR !== "NONE"
    ) {
      this._channel = ChannelEnum.CustomDestination;
    } else {
      this._channel = ChannelEnum.Default;
    }
  }
}

export enum ChannelEnum {
  Default,
  CustomIncoming,
  CustomDestination,
}
