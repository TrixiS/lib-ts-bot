import { CommandContext } from "../command";
import { CooldownBucket, CooldownManager, GetBucketOptions } from "../cooldown";
import { commandCheckFactory } from "./checkFactory";

export const commandCooldown = ({
  cooldownManager,
  cooldownCallback,
}: CommandCooldownOptions) => {
  return commandCheckFactory(async (ctx) => {
    const getBucketOptions: GetBucketOptions = {
      guildId: ctx.interaction.guildId ?? undefined,
      channelId: ctx.interaction.channelId,
      commandId: ctx.interaction.commandId,
      userId: ctx.interaction.user.id,
    };

    const { bucket, isOnCooldown } =
      await cooldownManager.checkBucketOnCooldown(getBucketOptions);

    if (isOnCooldown) {
      if (cooldownCallback) {
        await cooldownCallback(ctx, bucket);
      }

      return false;
    }

    await cooldownManager.storage.recordUse(bucket.id);
    return true;
  });
};

export type CommandCooldownOptions = {
  cooldownManager: CooldownManager;
  cooldownCallback?: (
    ctx: CommandContext,
    bucket: CooldownBucket
  ) => Promise<unknown>;
};
