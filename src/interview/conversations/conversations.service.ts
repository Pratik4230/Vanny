import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateConversationDto } from './dto/create-conversation.dto';

const PENDING = 'PENDING';
const ACTIVE = 'ACTIVE';
const COMPLETED = 'COMPLETED';

const conversationSelect = {
  id: true,
  userId: true,
  formatId: true,
  status: true,
  track: true,
  focusAreas: true,
  difficulty: true,
  durationMinutes: true,
  language: true,
  startedAt: true,
  endedAt: true,
  durationSeconds: true,
  createdAt: true,
  updatedAt: true,
  format: {
    select: {
      id: true,
      title: true,
    },
  },
} as const;

@Injectable()
export class ConversationsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateConversationDto) {
    const format = await this.prisma.interviewFormat.findFirst({
      where: { id: dto.formatId, isActive: true },
    });
    if (!format) throw new NotFoundException('Interview format not found');

    return this.prisma.conversation.create({
      data: {
        userId,
        formatId: dto.formatId,
        track: dto.track,
        focusAreas: dto.focusAreas ?? [],
        difficulty: dto.difficulty,
        durationMinutes: dto.durationMinutes,
        language: dto.language,
        status: PENDING,
      },
      select: conversationSelect,
    });
  }

  async findAllForUser(userId: string) {
    return this.prisma.conversation.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: conversationSelect,
    });
  }

  async findOneForUser(userId: string, conversationId: string) {
    const conversation = await this.prisma.conversation.findFirst({
      where: { id: conversationId, userId },
      select: {
        ...conversationSelect,
        messages: {
          orderBy: { turnIndex: 'asc' },
          select: {
            id: true,
            turnIndex: true,
            questionText: true,
            transcriptText: true,
            aiResponseText: true,
            durationMs: true,
            createdAt: true,
          },
        },
      },
    });

    if (!conversation) throw new NotFoundException('Conversation not found');

    return conversation;
  }

  async end(userId: string, conversationId: string) {
    const conversation = await this.prisma.conversation.findFirst({
      where: { id: conversationId, userId },
    });

    if (!conversation) throw new NotFoundException('Conversation not found');

    if (conversation.status !== PENDING && conversation.status !== ACTIVE) {
      throw new BadRequestException(
        `Cannot end conversation in status ${conversation.status}`,
      );
    }

    const endedAt = new Date();
    const durationSeconds = conversation.startedAt
      ? Math.max(
          0,
          Math.floor(
            (endedAt.getTime() - conversation.startedAt.getTime()) / 1000,
          ),
        )
      : 0;

    return this.prisma.conversation.update({
      where: { id: conversationId },
      data: {
        status: COMPLETED,
        endedAt,
        durationSeconds,
      },
      select: conversationSelect,
    });
  }
}
