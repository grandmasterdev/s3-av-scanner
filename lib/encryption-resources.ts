import { aws_kms as kms } from "aws-cdk-lib";
import { Construct } from "constructs";
import { EncryptionResourcesProps } from "./types";

export class EncryptionResources extends Construct {
  private readonly kmsAlias: string = "scanner-encryption-key";

  private _kmsKey: kms.IKey;

  constructor(scope: Construct, id: string, props: EncryptionResourcesProps) {
    super(scope, id);

    this._kmsKey = new kms.Key(this, `${id}-encryption-key`, {
      alias: this.kmsAlias,
      enabled: true,
    });
  }

  public get kmsKey() {
    return this._kmsKey;
  }
}
