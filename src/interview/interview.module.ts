import { Module } from '@nestjs/common';
import { ConversationsController } from './conversations/conversations.controller';
import { ConversationsService } from './conversations/conversations.service';
import { FormatsController } from './formats/formats.controller';
import { FormatsService } from './formats/formats.service';

@Module({
  controllers: [FormatsController, ConversationsController],
  providers: [FormatsService, ConversationsService],
  exports: [FormatsService, ConversationsService],
})
export class InterviewModule {}
