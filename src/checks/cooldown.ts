import { CommandInteraction } from "discord.js";
import { CommandContext } from "../command";
import { commandCheckFactory } from "./checkFactory";

export interface CooldownBucket {
  useCount: number;
  expiresAt: Date;
}

export interface BaseCooldownManagerOptions {
  readonly maxUseCount: number;
  readonly timeoutMs: number;
}

export abstract class BaseCooldownManager<
  T extends CooldownBucket,
  O extends BaseCooldownManagerOptions
> {
  constructor(public readonly options: O) {}

  protected abstract resetBucket(bucket: T): unknown;
  protected abstract incrementUseCount(bucket: T): unknown;
  protected abstract checkBucketOnCooldown(
    bucket: T
  ): boolean | Promise<boolean>;

  protected createExpirationDate(startDate: Date) {
    return new Date(startDate.getTime() + this.options.timeoutMs);
  }

  protected createExpirationDateFromNow() {
    return this.createExpirationDate(new Date());
  }
}

export enum CommandCooldownStrategy {
  guild,
  member,
  channel,
  user,
}

export interface CommandCooldownBucket extends CooldownBucket {
  userId: string;
  guildId?: string;
  channelId?: string;
}

export interface CommandCooldownManagerOptions
  extends BaseCooldownManagerOptions {
  commandId: string;
  strategy: CommandCooldownStrategy;
}

export class CommandCooldownManager extends BaseCooldownManager<
  CommandCooldownBucket,
  CommandCooldownManagerOptions
> {
  private _buckets: CommandCooldownBucket[] = [];

  protected resetBucket(bucket: CooldownBucket) {
    bucket.useCount = 0;
    bucket.expiresAt = this.createExpirationDateFromNow();
  }

  protected incrementUseCount(bucket: CooldownBucket) {
    bucket.useCount++;
  }

  protected checkBucketOnCooldown(bucket: CommandCooldownBucket) {
    const now = new Date();

    if (bucket.expiresAt.getTime() <= now.getTime()) {
      this.resetBucket(bucket);
      this.incrementUseCount(bucket);
      return false;
    }

    return bucket.useCount >= this.options.maxUseCount;
  }

  private findBucket(interaction: CommandInteraction) {
    const bucketFilter = (bucket: CommandCooldownBucket) => {
      switch (this.options.strategy) {
        case CommandCooldownStrategy.channel:
          return bucket.channelId === interaction.channelId;
        case CommandCooldownStrategy.guild:
          return bucket.guildId === interaction.guildId;
        case CommandCooldownStrategy.member:
          return (
            bucket.guildId === interaction.guildId &&
            bucket.userId === interaction.user.id
          );
        case CommandCooldownStrategy.user:
          return bucket.userId === interaction.user.id;
      }
    };

    return this._buckets.find(bucketFilter);
  }

  private getBucket(interaction: CommandInteraction) {
    const bucket = this.findBucket(interaction);

    if (bucket) {
      return bucket;
    }

    const newBucket: CommandCooldownBucket = {
      useCount: 0,
      userId: interaction.user.id,
      guildId: interaction.guildId ?? undefined,
      channelId: interaction.channelId,
      expiresAt: this.createExpirationDateFromNow(),
    };

    this._buckets.push(newBucket);
    return newBucket;
  }

  public recordCommandUse(interaction: CommandInteraction) {
    const bucket = this.getBucket(interaction);
    this.incrementUseCount(bucket);
  }

  public checkCommandOnCooldown(interaction: CommandInteraction) {
    const bucket = this.getBucket(interaction);

    return {
      bucket,
      isOnCooldown: bucket && this.checkBucketOnCooldown(bucket),
    };
  }
}

export type CommandCooldownOptions = Pick<
  CommandCooldownManagerOptions,
  "timeoutMs" | "maxUseCount" | "strategy"
> & {
  cooldownCallback?: (
    ctx: CommandContext,
    bucket: CommandCooldownBucket
  ) => Promise<unknown>;
};

export const commandCooldown = (options: CommandCooldownOptions) => {
  let cooldownManager: CommandCooldownManager;

  return commandCheckFactory(async (ctx) => {
    if (!cooldownManager) {
      cooldownManager = new CommandCooldownManager({
        commandId: ctx.interaction.commandId!,
        ...options,
      });
    }

    const { bucket, isOnCooldown } = cooldownManager.checkCommandOnCooldown(
      ctx.interaction
    );

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
