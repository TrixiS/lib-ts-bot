import { Collection } from "discord.js";
import { nanoid } from "nanoid/async";

export enum CooldownStrategy {
  guild,
  member,
  channel,
  user,
}

export interface CooldownBucket {
  readonly id: string;
  readonly guildId?: string;
  readonly userId?: string;
  readonly channelId?: string;
  readonly commandId?: string;
  currentUseCount: number;
  expiresAt: Date;
}

export type GetBucketOptions = Pick<
  CooldownBucket,
  "guildId" | "userId" | "channelId" | "commandId"
>;

export type CreateBucketOptions = GetBucketOptions & { timeoutMs: number };

export interface BucketStorage {
  findBucket: (
    strategy: CooldownStrategy,
    options: GetBucketOptions
  ) => Promise<CooldownBucket>;
  removeBucket: (bucketId: string) => Promise<void>;
  recordUse: (bucketId: string) => Promise<void>;
}

export const getBucketExpirationDate = (options: {
  currentDate?: Date;
  timeoutMs: number;
}) => {
  const currentDate = options.currentDate ?? new Date();
  return new Date(currentDate.getTime() + options.timeoutMs);
};

export class MemoryBucketStorage implements BucketStorage {
  constructor(
    public readonly maxUseCount: number,
    public readonly timeoutMs: number
  ) {}

  private buckets: Collection<string, CooldownBucket> = new Collection();

  private async createBucket(options: GetBucketOptions) {
    const bucket: CooldownBucket = {
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
    const cachedBucket = this.buckets.find(
      (bucket) =>
        bucket.guildId === options.guildId &&
        bucket.channelId === options.channelId &&
        bucket.userId === options.userId &&
        bucket.commandId === options.commandId
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

export class CooldownManager {
  constructor(
    public readonly strategy: CooldownStrategy,
    public readonly storage: BucketStorage
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
