import { BaseExtension } from "../extension";
import { eventHandler } from "../eventHandler";
import { ChatInputCommandInteraction, Interaction } from "discord.js";
import { runCallbackName } from "../command";

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

    if (!(await command.runChecks(ctx))) {
      return;
    }

    ctx.data = await command.getData(interaction);

    const runHandler = command.handlers.find(
      (handler) => handler.name === runCallbackName
    );

    const runDefaultHandler = async () => {
      if (!runHandler) {
        return;
      }

      return await runHandler.callback.call(command, ctx);
    };

    if (!(interaction instanceof ChatInputCommandInteraction)) {
      return await runDefaultHandler();
    }

    const { group: subcommandGroup, name: subcommandName } =
      this.getSubcommandData(interaction);

    if (!subcommandName) {
      return await runDefaultHandler();
    }

    const subcommandHandler = command.handlers.find(
      (handler) =>
        handler.group == subcommandGroup && handler.name === subcommandName
    );

    await subcommandHandler?.callback.call(command, ctx);
  }

  getSubcommandData(interaction: ChatInputCommandInteraction) {
    const name: string | null = interaction.options.getSubcommand(false);
    const group: string | null = interaction.options.getSubcommandGroup(false);
    return { group, name };
  }
}
