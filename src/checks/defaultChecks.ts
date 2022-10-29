import { commandCheckFactory } from "./checkFactory";
import { CommandContext } from "../command";
import { PermissionResolvable } from "discord.js";
import type {
  BaseCommandCooldownManager,
  CommandCooldownBucket,
  CommandCooldownManagerOptions,
} from "./cooldown";

export const guildOnlyCommand = () => {
  return commandCheckFactory(async ({ interaction }: CommandContext) => {
    return Boolean(interaction.guild && interaction.member);
  });
};

export const permittedCommand = (...permissions: PermissionResolvable[]) => {
  return commandCheckFactory(async ({ interaction }: CommandContext) => {
    if (!interaction.guild) {
      return false;
    }

    const resolvedMember = interaction.guild.members.resolve(
      interaction.user.id
    );

    if (!resolvedMember) {
      return false;
    }

    return permissions
      .map((permission) => resolvedMember.permissions.has(permission))
      .every((result) => result);
  });
};

export const commandCooldown = ({
  cooldownManager: CooldownManager,
  ...options
}: CommandCooldownOptions) => {
  let cooldownManager: InstanceType<typeof CooldownManager>;

  return commandCheckFactory(async (ctx) => {
    if (!cooldownManager) {
      cooldownManager = new CooldownManager({
        commandId: ctx.interaction.commandId!,
        ...options,
      });
    }

    const { bucket, isOnCooldown } =
      await cooldownManager.checkCommandOnCooldown(ctx.interaction);

    if (isOnCooldown) {
      if (options.cooldownCallback) {
        await options.cooldownCallback(ctx, bucket);
      }

      return false;
    }

    cooldownManager.recordCommandUse(ctx.interaction);
    return true;
  });
};

export type CommandCooldownOptions = Pick<
  CommandCooldownManagerOptions,
  "timeoutMs" | "maxUseCount" | "strategy"
> & {
  cooldownManager: new (
    options: CommandCooldownManagerOptions
  ) => BaseCommandCooldownManager;
  cooldownCallback?: (
    ctx: CommandContext,
    bucket: CommandCooldownBucket
  ) => Promise<unknown>;
};
