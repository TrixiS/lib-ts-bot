import { BaseSlashCommand } from "./command";
import { BaseExtension } from "./extension";

type Subclass<T extends abstract new (...args: any[]) => any> = new (
  ...args: any[]
) => InstanceType<T>;

export type CommandSubclass = Subclass<typeof BaseSlashCommand<any>>;
export type ExtensionSubclass = Subclass<typeof BaseExtension>;
