import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '../../generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';

@Injectable()
export class PrismaService implements OnModuleInit {
  private readonly client: PrismaClient;

  constructor() {
    const adapter = new PrismaPg(process.env.DATABASE_URL!);
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
}
