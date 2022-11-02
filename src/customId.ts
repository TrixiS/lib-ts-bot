import { z, ZodObject } from "zod";

const customIdMaxLength = 100;

export class CustomId<TSchema extends ZodObject<any>> {
  constructor(
    public readonly prefix: string,
    public readonly schema: TSchema
  ) {}

  public pack(data: z.infer<TSchema>) {
    const dataJson = JSON.stringify(data);
    const packedData = `${this.prefix}${dataJson}`;

    if (packedData.length > customIdMaxLength) {
      throw new Error("Too long custom id");
    }

    return packedData;
  }

  public unpack(customId: string): z.infer<TSchema> {
    if (!customId.startsWith(this.prefix)) {
      throw new Error("Invalid payload");
    }

    const packedData = customId.substring(this.prefix.length);
    const unpackedData = JSON.parse(packedData);
    return this.schema.parse(unpackedData);
  }
}
