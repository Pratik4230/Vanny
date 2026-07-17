import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class FormatsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAllActive() {
    return this.prisma.interviewFormat.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        title: true,
        createdAt: true,
      },
    });
  }

  async findActiveById(id: string) {
    const format = await this.prisma.interviewFormat.findFirst({
      where: { id, isActive: true },
      select: {
        id: true,
        title: true,
        baseSystemPrompt: true,
        createdAt: true,
      },
    });

    if (!format) throw new NotFoundException('Interview format not found ');
    return format;
  }
}
