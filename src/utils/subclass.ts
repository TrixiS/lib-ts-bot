export type Subclass<T extends abstract new (...args: any[]) => any> = new (
  ...args: any[]
) => InstanceType<T>;
