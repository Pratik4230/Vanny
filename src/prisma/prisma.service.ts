import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client.js';

@Injectable()
export class PrismaService implements OnModuleInit {
  private readonly client: PrismaClient;

  constructor() {
    const adapter = new PrismaPg({
      connectionString: process.env.DATABASE_URL!,
    });
    this.client = new PrismaClient({ adapter });
  }

  async onModuleInit() {
    await this.client.$connect();
  }

  get user() {
    return this.client.user;
  }

  get $transaction(): PrismaClient['$transaction'] {
    return this.client.$transaction.bind(
      this.client,
    ) as PrismaClient['$transaction'];
  }

  async isHealthy(): Promise<boolean> {
    await this.client.$queryRaw`SELECT 1`;
    return true;
  }

  get interviewFormat() {
    return this.client.interviewFormat;
  }

  get conversation() {
    return this.client.conversation;
  }

  get message() {
    return this.client.message;
  }
}
