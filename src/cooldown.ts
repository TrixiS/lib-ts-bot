import { Collection } from "discord.js";
import { nanoid } from "nanoid/async";
import { commandCheckFactory } from "./checkFactories";
import { CommandContext } from "./command";

export const CooldownStrategies = [
  "guild",
  "member",
  "channel",
  "user",
] as const;

export type CooldownStrategy = typeof CooldownStrategies[number];

type CooldownStrategyResolver<BucketId> = (
  bucket: CooldownBucket<BucketId>,
  options: GetBucketOptions
) => boolean;

const createStrategyResolver = <BucketId>(
  resolver: CooldownStrategyResolver<BucketId>
): CooldownStrategyResolver<BucketId> => {
  return (bucket, options) =>
    bucket.commandId === options.commandId && resolver(bucket, options);
};

const cooldownStrategyResolvers: Record<
  CooldownStrategy,
  CooldownStrategyResolver<any>
> = {
  channel: createStrategyResolver(
    (bucket, options) => bucket.channelId === options.channelId
  ),
  guild: createStrategyResolver(
    (bucket, options) => bucket.guildId === options.guildId
  ),
  user: createStrategyResolver(
    (bucket, options) => bucket.userId === options.userId
  ),
  member: createStrategyResolver(
    (bucket, options) =>
      bucket.guildId === options.guildId && bucket.userId === options.userId
  ),
} as const;

export interface CooldownBucket<ID> {
  readonly id: ID;
  readonly guildId?: string;
  readonly userId: string;
  readonly channelId?: string;
  readonly commandId: string;
  currentUseCount: number;
  expiresAt: Date;
}

export type GetBucketOptions = Pick<
  CooldownBucket<any>,
  "guildId" | "userId" | "channelId" | "commandId"
>;

export interface BucketStorage<BucketId> {
  findBucket: (
    strategy: CooldownStrategy,
    options: GetBucketOptions
  ) => Promise<CooldownBucket<BucketId>>;
  removeBucket: (bucketId: BucketId) => Promise<void>;
  recordUse: (bucketId: BucketId) => Promise<void>;
}

export const getBucketExpirationDate = (options: {
  currentDate?: Date;
  timeoutMs: number;
}) => {
  const currentDate = options.currentDate ?? new Date();
  return new Date(currentDate.getTime() + options.timeoutMs);
};

export class MemoryBucketStorage implements BucketStorage<string> {
  constructor(
    public readonly maxUseCount: number,
    public readonly timeoutMs: number
  ) {}

  private buckets: Collection<string, CooldownBucket<string>> =
    new Collection();

  private async createBucket(options: GetBucketOptions) {
    const bucket: CooldownBucket<string> = {
      id: await nanoid(),
      currentUseCount: 0,
      expiresAt: getBucketExpirationDate({ timeoutMs: this.timeoutMs }),
      ...options,
    };

    this.buckets.set(bucket.id, bucket);
    return bucket;
  }

  public async findBucket(
    strategy: CooldownStrategy,
    options: GetBucketOptions
  ) {
    const resolver = cooldownStrategyResolvers[strategy];
    const cachedBucket = this.buckets.find((bucket) =>
      resolver(bucket, options)
    );

    if (cachedBucket) {
      return cachedBucket;
    }

    return await this.createBucket(options);
  }

  public async removeBucket(bucketId: string) {
    this.buckets.delete(bucketId);
  }

  public async recordUse(bucketId: string) {
    const bucket = this.buckets.get(bucketId);

    if (!bucket) {
      return;
    }

    if (bucket.currentUseCount >= this.maxUseCount) {
      bucket.expiresAt = getBucketExpirationDate({
        currentDate: bucket.expiresAt,
        timeoutMs: this.timeoutMs,
      });

      bucket.currentUseCount = 0;
    }

    bucket.currentUseCount += 1;
  }
}

export class CooldownManager<BucketId> {
  constructor(
    public readonly strategy: CooldownStrategy,
    public readonly storage: BucketStorage<BucketId>
  ) {}

  async checkBucketOnCooldown(options: GetBucketOptions) {
    const bucket = await this.storage.findBucket(this.strategy, options);
    const now = new Date();

    if (now.getTime() >= bucket.expiresAt.getTime()) {
      await this.storage.removeBucket(bucket.id);
      return { isOnCooldown: false, bucket };
    }

    return { isOnCooldown: true, bucket };
  }

  async recordUse(options: GetBucketOptions) {
    const bucket = await this.storage.findBucket(this.strategy, options);
    await this.storage.recordUse(bucket.id);
  }
}

export const commandCooldown = <BucketId>({
  cooldownManager,
  cooldownCallback,
}: CommandCooldownOptions<BucketId>) => {
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

export type CommandCooldownOptions<BucketId> = {
  cooldownManager: CooldownManager<BucketId>;
  cooldownCallback?: (
    ctx: CommandContext,
    bucket: CooldownBucket<BucketId>
  ) => Promise<unknown>;
};
