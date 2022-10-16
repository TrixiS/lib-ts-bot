import { BaseSlashCommand, CommandContext } from "../command";
import { CommandHandler } from "../commandHandler";

export type CommandCheck = (ctx: CommandContext) => Promise<boolean>;

export const commandCheckFactory = (check: CommandCheck): ClassDecorator => {
  return (constructor: Function) => {
    const checksArray = (BaseSlashCommand as any)._checks.get(
      constructor.name
    ) as CommandCheck[];

    checksArray.push(check);
  };
};

export const handlerCheckFactory = (check: CommandCheck): MethodDecorator => {
  return (target, propertyKey) => {
    const handler: CommandHandler = (BaseSlashCommand as any)._handlers
      .get(target.constructor.name)
      .get(propertyKey);

    handler.checks.push(check);
  };
};
