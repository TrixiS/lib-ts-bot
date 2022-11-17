import { ClientEvents } from "discord.js";
import { EventHandlerCheck } from "./checks/checkFactory";
import { BaseExtension } from "./extension";

export type ClientEvent = keyof ClientEvents;

export const eventHandler = <TEvent extends ClientEvent>(
  options: EventHandlerOptions<TEvent>
): MethodDecorator => {
  return (target, propertyKey, descriptor: PropertyDescriptor) => {
    const handler: EventHandler<typeof options["event"]> = {
      ...options,
      listener: descriptor.value!,
      checks: [],
      methodName: propertyKey.toString(),
    };

    const extensionEventHandlers: EventHandler<ClientEvent>[] = (
      BaseExtension as any
    )._eventHandlers.get(target.constructor.name);

    extensionEventHandlers.push(handler as any);
  };
};

export type EventHandlerOptions<TEvent extends ClientEvent> = {
  event: TEvent;
  once?: boolean;
};

export type EventHandler<TEvent extends ClientEvent> =
  EventHandlerOptions<TEvent> & {
    listener: EventListener<TEvent>;
    checks: EventHandlerCheck<TEvent>[];
    methodName: string;
  };

export type EventListener<TEvent extends ClientEvent> = (
  ...args: ClientEvents[TEvent]
) => Promise<any>;
