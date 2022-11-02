import { BotClient } from "./client";
import { BaseSlashCommand } from "./command";
import { ClientEvent, EventHandler, EventListener } from "./eventHandler";
import { CommandSubclass } from "./types";
import { DefaultMap } from "./utils/defaultMap";

export abstract class BaseExtension {
  private static _eventHandlers: DefaultMap<
    string,
    EventHandler<ClientEvent>[]
  > = new DefaultMap(() => []);

  private _commands: BaseSlashCommand[] = [];

  constructor(public readonly client: BotClient, commands?: CommandSubclass[]) {
    this._registerEventHandlers();

    if (commands && commands.length) {
      commands.forEach((Command) => this.addCommand(Command));
    }
  }

  private _getEventHandlers() {
    return BaseExtension._eventHandlers.get(this.constructor.name);
  }

  private _wrapEventHandler<TEvent extends ClientEvent>(
    handler: EventHandler<TEvent>
  ) {
    const listenerWrapper: EventListener<TEvent> = async (...args) => {
      for (const check of handler.checks) {
        if (!(await check(...args))) {
          return;
        }
      }

      handler.listener.apply(this, args);
    };

    handler.listener = listenerWrapper;
    return handler;
  }

  private _registerEventHandlers() {
    const eventHandlers = this._getEventHandlers();

    eventHandlers.forEach((handler) => {
      const wrappedEventHandler = this._wrapEventHandler(handler);

      handler.once
        ? this.client.once(handler.event, wrappedEventHandler.listener)
        : this.client.on(handler.event, wrappedEventHandler.listener);
    });
  }

  private _unregisterEventHandlers() {
    const eventHandlers = this._getEventHandlers();
    eventHandlers.forEach((handler) =>
      this.client.off(handler.event, handler.listener)
    );
  }

  public get commands(): ReadonlyArray<BaseSlashCommand> {
    return this._commands;
  }

  public addCommand(Command: CommandSubclass) {
    const command = new Command(this);
    this._commands.push(command);
  }

  public async register() {
    await Promise.all(
      this._commands.map((command) => this.client.registerCommand(command))
    );
  }

  public async unregister() {
    this._unregisterEventHandlers();
  }
}
