import { Client, ClientOptions } from "discord.js";
import { BaseExtension } from "./extension";
import { BaseSlashCommand, CommandBuilder } from "./command";
import { ExtensionSubclass } from "./types";

export class BotClient extends Client {
  private _extensions: Map<string, BaseExtension> = new Map();
  private _commands: Map<string, BaseSlashCommand> = new Map();

  constructor(options: ClientOptions) {
    super(options);
  }

  public get extensions(): ReadonlyMap<string, Readonly<BaseExtension>> {
    return this._extensions;
  }

  public get commands(): ReadonlyMap<string, BaseSlashCommand> {
    return this._commands;
  }

  public async registerCommand(command: BaseSlashCommand) {
    if (!command.builder) {
      throw new Error(`Command builder couldn't be ${command.builder}`);
    }

    const commandJson = command.builder.toJSON();
    await this.application?.commands.create(commandJson);
    this._commands.set(command.builder.name, command);
    return command;
  }

  public async registerExtension(
    Extension: ExtensionSubclass,
    commands?: ConstructorParameters<ExtensionSubclass>[1]
  ) {
    const extension = new Extension(this, commands);
    this._extensions.set(Extension.name, extension);
    await extension.register();
    return extension;
  }
}
