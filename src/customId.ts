import { z, ZodObject } from "zod";

const customIdMaxLength = 100;

export class CustomId<TSchema extends ZodObject<any>> {
  private readonly _prefixDataSeparator = ":";

  constructor(
    public readonly prefix: string,
    public readonly schema: TSchema
  ) {}

  public parse(customId: string) {
    const prefix = customId.slice(0, this.prefix.length);
    const data = customId.substring(
      this.prefix.length + this._prefixDataSeparator.length
    );

    return { prefix, data };
  }

  public pack(data: z.infer<TSchema>) {
    const dataJson = JSON.stringify(data);
    const packedData = `${this.prefix}${this._prefixDataSeparator}${dataJson}`;

    if (packedData.length > customIdMaxLength) {
      throw new Error("Too long custom id");
    }

    return packedData;
  }

  public unpack(customId: string): z.infer<TSchema> {
    const { prefix, data } = this.parse(customId);

    if (prefix !== this.prefix) {
      throw new Error("Invalid payload");
    }

    const unpackedData = JSON.parse(data);
    return this.schema.parse(unpackedData);
  }
}
