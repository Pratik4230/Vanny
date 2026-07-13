import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client: Redis;
  constructor(private readonly config: ConfigService) {}

  onModuleInit() {
    this.client = new Redis(this.config.get<string>('REDIS_URL')!);
  }

  async onModuleDestroy() {
    await this.client.quit();
  }

  get redis(): Redis {
    return this.client;
  }
}
