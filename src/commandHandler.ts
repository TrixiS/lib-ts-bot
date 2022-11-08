import { InteractionDeferReplyOptions } from "discord.js";
import { CommandCheck } from "./checks/checkFactory";
import { BaseSlashCommand, CommandCallback } from "./command";

export const commandHandler = (options: CommandHandlerOptions = {}) => {
  return (
    target: Object,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor
  ) => {
    options.name ??= propertyKey.toString();

    const handler: CommandHandler = {
      callback: descriptor.value!,
      checks: [],
      ...(options as CommandHandlerOptions & { name: string }),
    };

    (BaseSlashCommand as any)._handlers
      .get(target.constructor.name)
      ?.set(propertyKey, handler);
  };
};

export type CommandHandlerOptions = Partial<Pick<CommandHandler, "name">> &
  Pick<CommandHandler, "group" | "autoDeferOptions">;

export type CommandHandler = {
  callback: CommandCallback;
  name: string;
  group?: string;
  checks: CommandCheck[];
  autoDeferOptions?: InteractionDeferReplyOptions | null;
};
