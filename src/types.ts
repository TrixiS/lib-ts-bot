import { BaseSlashCommand } from "./command";
import { BaseExtension } from "./extension";

type Subclass<T> = new (...args: any[]) => T;

export type CommandSubclass = Subclass<BaseSlashCommand>;
export type ExtensionSubclass = Subclass<BaseExtension>;
