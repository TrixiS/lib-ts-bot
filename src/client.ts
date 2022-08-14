import { Client, ClientOptions } from "discord.js";
import { BaseExtension } from "./extension";
import { BaseSlashCommand } from "./command";
import { ExtensionSubclass } from "./types";

export class BotClient extends Client {
  private _extensions: BaseExtension[] = [];
  private _commands: Map<string, BaseSlashCommand> = new Map();

  constructor(options: ClientOptions) {
    super(options);
  }

  public get extensions(): ReadonlyArray<BaseExtension> {
    return this._extensions;
  }

  public get commands(): ReadonlyMap<string, BaseSlashCommand> {
    return this._commands;
  }

  public async registerCommand(command: BaseSlashCommand) {
    const commandJson = command.builder.toJSON();
    await this.application?.commands.create(commandJson as any);
    this._commands.set(command.builder.name, command);
  }

  public async registerExtension(Extension: ExtensionSubclass) {
    const extension = new Extension(this);
    this._extensions.push(extension);
    await extension.register();
  }
}
