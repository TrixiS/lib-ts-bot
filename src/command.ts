import {
  ApplicationCommandOptionType,
  CommandInteraction,
  ChatInputCommandInteraction,
  CommandInteractionOption,
  GuildMember,
  Guild
} from "discord.js";
import { BotClient } from "./client";
import { BaseExtension } from "./extension";
import { DefaultMap } from "./utils/defaultMap";
import { CommandCheck } from "./checks";
import { CommandHandler } from "./commandHandler";

export const runCallbackName = "run";

export interface CommandBuilder {
  toJSON: () => any; // @discordjs/builders package developers are just fucking morons
  name: string; //      that could not make their useless builders library compatible with discord.js (event it is the main package)
  // so i have to break types and use any
}

const accumulateCommandOptions = (
  options: Readonly<CommandInteractionOption[]>,
  accumulator: CommandInteractionOption[]
): CommandInteractionOption[] => {
  for (const option of options) {
    if (option.options?.length) {
      return accumulateCommandOptions(option.options, accumulator);
    }

    accumulator.push(option);
  }

  return accumulator;
};

const getCommandArgumentOptions = (
  interaction: ChatInputCommandInteraction
) => {
  const options: Record<string, any> = {};

  if (!interaction.command) {
    return options;
  }

  const flattenOptions = accumulateCommandOptions(interaction.options.data, []);

  for (const option of flattenOptions) {
    options[option.name] = convertCommandOptionValue(
      interaction.options,
      option
    );
  }

  return options;
};

const convertCommandOptionValue = (
  resolver: ChatInputCommandInteraction["options"],
  option: CommandInteractionOption
) => {
  type OptionConverter = (name: string, required?: boolean) => any;
  const excludedOptionConverter: OptionConverter = (..._) => undefined;

  const converters: Record<ApplicationCommandOptionType, OptionConverter> = {
    [ApplicationCommandOptionType.Attachment]: resolver.getAttachment,
    [ApplicationCommandOptionType.Boolean]: resolver.getBoolean,
    [ApplicationCommandOptionType.Channel]: resolver.getChannel,
    [ApplicationCommandOptionType.Integer]: resolver.getInteger,
    [ApplicationCommandOptionType.Mentionable]: resolver.getMentionable,
    [ApplicationCommandOptionType.Number]: resolver.getNumber,
    [ApplicationCommandOptionType.Role]: resolver.getRole,
    [ApplicationCommandOptionType.String]: resolver.getString,
    [ApplicationCommandOptionType.User]: resolver.getUser,
    [ApplicationCommandOptionType.Subcommand]: excludedOptionConverter,
    [ApplicationCommandOptionType.SubcommandGroup]: excludedOptionConverter
  };

  const converter = converters[option.type];
  return converter.call(resolver, option.name);
};

export abstract class BaseSlashCommand<
  TExtension extends BaseExtension = BaseExtension
> {
  private static _checks: DefaultMap<string, CommandCheck[]> = new DefaultMap(
    () => []
  );

  private static _handlers: DefaultMap<string, CommandHandler[]> =
    new DefaultMap(() => []);

  constructor(
    public readonly extension: TExtension,
    public readonly builder: CommandBuilder
  ) {}

  private _getChecks(): CommandCheck[] {
    return BaseSlashCommand._checks.get(this.constructor.name);
  }

  private _getHandlers(): CommandHandler[] {
    return BaseSlashCommand._handlers.get(this.constructor.name);
  }

  public get checks(): ReadonlyArray<CommandCheck> {
    return this._getChecks();
  }

  public get handlers(): ReadonlyArray<CommandHandler> {
    return this._getHandlers();
  }

  public addCheck(check: CommandCheck) {
    this._getChecks().push(check);
  }

  public addHandler(handler: CommandHandler) {
    this._getHandlers().push(handler);
  }

  public async runChecks(options: CommandRunOptions): Promise<boolean> {
    for (const check of this.checks) {
      if (!(await check(options))) {
        return false;
      }
    }

    return true;
  }

  public async getData(
    interaction: CommandInteraction
  ): Promise<Record<string, any>> {
    return {};
  }

  public getRunOptions(interaction: CommandInteraction): CommandRunOptions {
    const guild = interaction.guild ?? undefined;
    const member = guild?.members.cache.get(interaction.user.id);
    const options =
      interaction instanceof ChatInputCommandInteraction
        ? getCommandArgumentOptions(interaction)
        : {};

    return {
      interaction,
      member,
      guild,
      options,
      client: this.extension.client
    };
  }
}

export type CommandRunOptions<
  TInteraction = CommandInteraction,
  TArgumentOptions = Record<string, any>
> = {
  client: BotClient;
  interaction: TInteraction;
  options: TArgumentOptions;
  member?: GuildMember;
  guild?: Guild;
};

export type CommandCallback = (
  options: CommandRunOptions,
  data: Record<string, any>
) => Promise<any>;
