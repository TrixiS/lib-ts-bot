import { BaseExtension } from "./extension";
import { Awaitable, ClientEvents } from "discord.js";

export const eventHandler = <
  TEvent extends keyof ClientEvents,
  TExtension extends BaseExtension
>(
  event: TEvent
) => {
  return (
    target: TExtension,
    propertyKey: string,
    descriptor: TypedPropertyDescriptor<EventListener<TEvent>>
  ) => {
    const handler: EventHandler<TEvent> = {
      event,
      listener: descriptor.value!,
    };

    const extensionEventHandlers = (BaseExtension as any)._eventHandlers.get(
      target.constructor.name
    );

    extensionEventHandlers.push(handler);
  };
};

export type EventHandler<TEvent extends keyof ClientEvents> = {
  event: keyof ClientEvents;
  listener: EventListener<TEvent>;
};

export type EventListener<TEvent extends keyof ClientEvents> = (
  ...args: ClientEvents[TEvent]
) => Awaitable<any>;
