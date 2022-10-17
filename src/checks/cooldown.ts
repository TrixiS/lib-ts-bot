import { CommandInteraction } from "discord.js";

type PromiseOrSync<T> = T | Promise<T>;

export enum CommandCooldownStrategy {
  guild,
  member,
  channel,
  user,
}

export abstract class BaseCooldownManager<
  T extends CooldownBucket,
  O extends BaseCooldownManagerOptions
> {
  constructor(public readonly options: O) {}

  protected abstract resetBucket(bucket: T): unknown;
  protected abstract incrementUseCount(bucket: T): unknown;
  protected abstract checkBucketOnCooldown(bucket: T): PromiseOrSync<boolean>;

  protected createExpirationDate(startDate: Date) {
    return new Date(startDate.getTime() + this.options.timeoutMs);
  }

  protected createExpirationDateFromNow() {
    return this.createExpirationDate(new Date());
  }
}

export abstract class BaseCommandCooldownManager<
  B extends CommandCooldownBucket = CommandCooldownBucket
> extends BaseCooldownManager<B, CommandCooldownManagerOptions> {
  protected abstract getBucket(
    interaction: CommandInteraction
  ): PromiseOrSync<B>;

  protected async checkBucketOnCooldown(bucket: B) {
    const now = new Date();

    if (bucket.expiresAt.getTime() <= now.getTime()) {
      await this.resetBucket(bucket);
      return false;
    }

    return bucket.useCount >= this.options.maxUseCount;
  }

  public async checkCommandOnCooldown(interaction: CommandInteraction) {
    const bucket = await this.getBucket(interaction);
    const isOnCooldown = await this.checkBucketOnCooldown(bucket);
    return { bucket, isOnCooldown };
  }

  public async recordCommandUse(interaction: CommandInteraction) {
    const bucket = await this.getBucket(interaction);
    await this.incrementUseCount(bucket);
  }
}

export class MemoryCommandCooldownManager extends BaseCommandCooldownManager {
  private _buckets: CommandCooldownBucket[] = [];

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

  protected getBucket(interaction: CommandInteraction) {
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

  protected resetBucket(bucket: CooldownBucket) {
    bucket.useCount = 0;
    bucket.expiresAt = this.createExpirationDateFromNow();
  }

  protected incrementUseCount(bucket: CooldownBucket) {
    bucket.useCount++;
  }
}

export interface CooldownBucket {
  useCount: number;
  expiresAt: Date;
}

export interface CommandCooldownBucket extends CooldownBucket {
  userId: string;
  guildId?: string | null;
  channelId?: string | null;
}

export interface BaseCooldownManagerOptions {
  readonly maxUseCount: number;
  readonly timeoutMs: number;
}

export interface CommandCooldownManagerOptions
  extends BaseCooldownManagerOptions {
  commandId: string;
  strategy: CommandCooldownStrategy;
}

export type CommandCooldownResult = {
  bucket: CommandCooldownBucket;
  isOnCooldown: boolean;
};
