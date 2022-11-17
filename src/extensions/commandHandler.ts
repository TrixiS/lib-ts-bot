import {
  ChatInputCommandInteraction,
  CommandInteraction,
  Interaction,
} from "discord.js";
import { CommandCheck } from "../checks/checkFactory";
import { BaseSlashCommand, CommandContext } from "../command";
import { CommandHandler } from "../commandHandler";
import { eventHandler } from "../eventHandler";
import { BaseExtension } from "../extension";

export class CommandHandlerExtension extends BaseExtension {
  protected readonly _defaultHandlerName = "run";

  @eventHandler({ event: "interactionCreate" })
  async commandInteractionHandler(interaction: Interaction) {
    if (
      (!interaction.isChatInputCommand() || !interaction.command) &&
      !interaction.isContextMenuCommand()
    ) {
      return;
    }

    const command = this.client.commands.get(interaction.commandName);

    if (!command) {
      return;
    }

    const commandHandler = this.getCommandHandler(command, interaction);

    if (!commandHandler) {
      return;
    }

    if (commandHandler.autoDeferOptions !== null) {
      await interaction.deferReply(
        commandHandler.autoDeferOptions ?? { ephemeral: true }
      );
    }

    const ctx = await command.getContext(interaction);

    if (!(await this.runChecks(ctx, command.checks))) {
      return;
    }

    await this.runHandler(command, ctx, commandHandler);
  }

  getCommandHandler(
    command: BaseSlashCommand,
    interaction: CommandInteraction
  ) {
    const defaultHandler = command.handlers.get(this._defaultHandlerName);

    if (!(interaction instanceof ChatInputCommandInteraction)) {
      return defaultHandler;
    }

    const { group: subcommandGroup, name: subcommandName } =
      this.getSubcommandData(interaction);

    if (!subcommandName) {
      return defaultHandler;
    }

    const subcommandHandler = command.handlers.find(
      (handler) =>
        handler.group == subcommandGroup && handler.name === subcommandName
    );

    return subcommandHandler ?? defaultHandler;
  }

  getSubcommandData(interaction: ChatInputCommandInteraction) {
    const name = interaction.options.getSubcommand(false);
    const group = interaction.options.getSubcommandGroup(false);
    return { group, name };
  }

  public async runChecks(ctx: CommandContext, checks: Iterable<CommandCheck>) {
    for (const check of checks) {
      if (!(await check(ctx))) {
        return false;
      }
    }

    return true;
  }

  public async runHandler(
    command: BaseSlashCommand,
    ctx: CommandContext,
    handler: CommandHandler
  ) {
    if (!(await this.runChecks(ctx, handler.checks))) {
      return;
    }

    return await handler.callback?.call(command, ctx);
  }
}
