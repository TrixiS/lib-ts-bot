import {
  ApplicationCommandOptionType,
  CommandInteraction,
  ChatInputCommandInteraction,
  CommandInteractionOption,
  GuildMember,
  Guild,
  Collection,
  ApplicationCommandDataResolvable,
} from "discord.js";
import { BotClient } from "./client";
import { BaseExtension } from "./extension";
import { DefaultMap } from "./utils/defaultMap";
import { CommandCheck } from "./checks/checkFactory";
import { CommandHandler } from "./commandHandler";

export interface CommandBuilder {
  toJSON: () => ApplicationCommandDataResolvable;
  name: string;
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
    [ApplicationCommandOptionType.SubcommandGroup]: excludedOptionConverter,
  };

  const converter = converters[option.type];
  return converter.call(resolver, option.name);
};

export abstract class BaseSlashCommand<
  TExtension extends BaseExtension = BaseExtension
> {
  protected static _checks: DefaultMap<string, CommandCheck[]> = new DefaultMap(
    () => []
  );

  protected static _handlers: DefaultMap<
    string,
    Collection<string, CommandHandler>
  > = new DefaultMap(() => new Collection());

  constructor(
    public readonly extension: TExtension,
    public readonly builder?: CommandBuilder
  ) {}

  public get checks(): ReadonlyArray<CommandCheck> {
    return BaseSlashCommand._checks.get(this.constructor.name);
  }

  public get handlers() {
    return BaseSlashCommand._handlers.get(this.constructor.name);
  }

  public async getData(interaction: CommandInteraction) {
    return {};
  }

  public async getContext(
    interaction: CommandInteraction
  ): Promise<CommandContext> {
    const guild = interaction.guild ?? undefined;
    const member = guild?.members.cache.get(interaction.user.id);

    const options =
      interaction instanceof ChatInputCommandInteraction
        ? getCommandArgumentOptions(interaction)
        : {};

    const data = await this.getData(interaction);

    return {
      client: this.extension.client,
      interaction,
      member,
      guild,
      options,
      data,
    };
  }
}

export type CommandContext<
  I extends CommandInteraction = CommandInteraction,
  O extends Record<string, any> = Record<string, any>,
  D extends Record<string, any> = Record<string, any>
> = {
  client: BotClient;
  interaction: I;
  member?: GuildMember;
  guild?: Guild;
  options: O;
  data: D;
};

export type CommandCallback = (ctx: CommandContext) => Promise<any>;
