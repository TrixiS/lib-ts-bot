import { BaseSlashCommand, CommandContext } from "../command";
import { CommandSubclass } from "../types";

export type CommandCheck = (ctx: CommandContext) => Promise<boolean>;

export const checkFactory = (check: CommandCheck) => {
  return (constructor: CommandSubclass) => {
    const checksArray = (BaseSlashCommand as any)._checks.get(constructor.name);
    checksArray.push(check);
  };
};
