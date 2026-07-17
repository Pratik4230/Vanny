import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { ConversationsService } from './conversations.service';
import { CreateConversationDto } from './dto/create-conversation.dto';

@Controller('conversations')
export class ConversationsController {
  constructor(private readonly conversations: ConversationsService) {}

  @Post()
  create(
    @CurrentUser('sub') userId: string,
    @Body() dto: CreateConversationDto,
  ) {
    return this.conversations.create(userId, dto);
  }

  @Get()
  findAll(@CurrentUser('sub') userId: string) {
    return this.conversations.findAllForUser(userId);
  }

  @Get(':id')
  findOne(
    @CurrentUser('sub') userId: string,
    @Param('id') conversationId: string,
  ) {
    return this.conversations.findOneForUser(userId, conversationId);
  }

  @Post(':id/end')
  end(@CurrentUser('sub') userId: string, @Param('id') conversationId: string) {
    return this.conversations.end(userId, conversationId);
  }
}
