import { ClientEvents } from "discord.js";
import { BaseSlashCommand, CommandContext } from "../command";
import { CommandHandler } from "../commandHandler";
import { ClientEvent, EventHandler } from "../eventHandler";
import { BaseExtension } from "../extension";
import { CommandSubclass } from "../types";

export type CommandCheck = (ctx: CommandContext) => Promise<boolean>;

export const commandCheckFactory =
  (check: CommandCheck) => (constructor: CommandSubclass) => {
    const checksArray = (BaseSlashCommand as any)._checks.get(
      constructor.name
    ) as CommandCheck[];

    checksArray.push(check);
  };

export const commandHandlerCheckFactory =
  (check: CommandCheck): MethodDecorator =>
  (target, propertyKey) => {
    const handler: CommandHandler = (BaseSlashCommand as any)._handlers
      .get(target.constructor.name)
      .get(propertyKey.toString());

    handler.checks.push(check);
  };

export const eventHandlerCheckFactory =
  <TEvent extends ClientEvent>(
    check: EventHandlerCheck<TEvent>
  ): MethodDecorator =>
  (target, propertyKey) => {
    const extensionEventHandlers: EventHandler<TEvent>[] = (
      BaseExtension as any
    )._eventHandlers.get(target.constructor.name);

    const handler = extensionEventHandlers.find(
      (handler) => handler.methodName === propertyKey
    );

    if (!handler) {
      return;
    }

    handler.checks.push(check);
  };

export type EventHandlerCheck<TEvent extends ClientEvent> = (
  ...args: ClientEvents[TEvent]
) => Promise<boolean>;
