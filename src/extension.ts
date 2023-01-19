import { BotClient } from "./client";
import { BaseSlashCommand, CommandSubclass } from "./command";
import { ClientEvent, EventHandler, EventListener } from "./eventHandler";
import { DefaultMap } from "./utils/defaultMap";
import { Subclass } from "./utils/subclass";

export type ExtensionSubclass = Subclass<typeof BaseExtension>;

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

  private _wrapEventListener<TEvent extends ClientEvent>(
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

    return listenerWrapper;
  }

  private _registerEventHandlers() {
    const eventHandlers = this._getEventHandlers();

    eventHandlers.forEach((handler) => {
      const wrappedEventListener = this._wrapEventListener(handler);

      handler.once
        ? this.client.once(handler.event, wrappedEventListener)
        : this.client.on(handler.event, wrappedEventListener);
    });
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
}
