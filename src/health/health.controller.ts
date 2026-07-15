import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { Public } from 'src/common/decorators/public.decorator';
import { PrismaService } from 'src/prisma/prisma.service';
import { RedisService } from 'src/redis/redis.service';

@Controller('health')
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  @Public()
  @Get()
  liveness() {
    return { status: 'ok' };
  }

  @Public()
  @Get('ready')
  async readiness() {
    try {
      await this.prisma.isHealthy();
      await this.redis.redis.ping();
      return { status: 'ok', postgres: true, redis: true };
    } catch {
      throw new ServiceUnavailableException('Dependency check failed');
    }
  }
}
