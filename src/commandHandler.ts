import { CommandCheck } from "./checks/checkFactory";
import { BaseSlashCommand, CommandCallback } from "./command";

export const commandHandler = (
  options: CommandHandlerOptions = {}
): MethodDecorator => {
  return (target, propertyKey, descriptor) => {
    const handler: CommandHandler = {
      callback: descriptor.value as CommandCallback,
      name: options.name ?? (propertyKey as string),
      group: options.group,
      checks: [],
    };

    (BaseSlashCommand as any)._handlers
      .get(target.constructor.name)
      .set(propertyKey, handler);
  };
};

export type CommandHandlerOptions = {
  name?: string;
  group?: string;
};

// TODO: add check here
// TODO: add parsed options converters as decorators as well e. g.
//       factory for converter decorator -> @converter("optionName")

export type CommandHandler = {
  callback: CommandCallback;
  name: string;
  group?: string;
  checks: CommandCheck[];
};
