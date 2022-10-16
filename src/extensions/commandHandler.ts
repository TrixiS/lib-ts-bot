import { BaseExtension } from "../extension";
import { eventHandler } from "../eventHandler";
import { ChatInputCommandInteraction, Interaction } from "discord.js";
import { BaseSlashCommand, CommandContext, runCallbackName } from "../command";
import { CommandSubclass } from "../types";
import { CommandHandler } from "../commandHandler";
import { CommandCheck } from "../checks/checkFactory";

export class CommandHandlerExtension extends BaseExtension {
  @eventHandler("interactionCreate")
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

    const ctx = command.getContext(interaction);

    if (!(await this.runChecks(ctx, command.checks))) {
      return;
    }

    ctx.data = await command.getData(interaction);

    const defaultHandler = command.handlers.get(
      runCallbackName as keyof CommandSubclass
    );

    const runDefaultHandler = async () => {
      if (!defaultHandler) {
        return;
      }

      return await this.runHandler(command, ctx, defaultHandler);
    };

    if (!(interaction instanceof ChatInputCommandInteraction)) {
      return await runDefaultHandler();
    }

    const { group: subcommandGroup, name: subcommandName } =
      this.getSubcommandData(interaction);

    if (!subcommandName) {
      return await runDefaultHandler();
    }

    const subcommandHandler: CommandHandler | undefined = command.handlers.find(
      (handler) =>
        handler.group == subcommandGroup && handler.name === subcommandName
    );

    if (subcommandHandler) {
      await this.runHandler(command, ctx, subcommandHandler);
    }
  }

  getSubcommandData(interaction: ChatInputCommandInteraction) {
    const name = interaction.options.getSubcommand(false);
    const group = interaction.options.getSubcommandGroup(false);
    return { group, name };
  }

  public async runChecks(
    ctx: CommandContext,
    checks: CommandCheck[] | ReadonlyArray<CommandCheck>
  ) {
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
