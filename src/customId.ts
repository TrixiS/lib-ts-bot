const customIdMaxLength = 100;

export class CustomId<TData extends Record<string, any> = Record<string, any>> {
  constructor(public readonly prefix: string) {}

  public parse(customId: string) {
    const prefix = customId.slice(0, this.prefix.length);
    const data = customId.substring(this.prefix.length);
    return { prefix, data };
  }

  public pack(data?: TData): string {
    if (!data) {
      return this.prefix;
    }

    const dataJson = JSON.stringify(data);
    const packedData = `${this.prefix}${dataJson}`;

    if (packedData.length > customIdMaxLength) {
      throw new Error("Too long custom id");
    }

    return packedData;
  }

  public unpack(customId: string): TData | undefined {
    const { prefix, data } = this.parse(customId);

    if (prefix !== this.prefix) {
      throw new Error("Invalid payload");
    }

    if (!data.length) {
      return undefined;
    }

    const unpackedData = JSON.parse(data);
    return unpackedData;
  }
}
