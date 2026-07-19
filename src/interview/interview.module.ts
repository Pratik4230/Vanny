import { Module } from '@nestjs/common';
import { AuthModule } from 'src/auth/auth.module';
import { ConversationsController } from './conversations/conversations.controller';
import { ConversationsService } from './conversations/conversations.service';
import { FormatsController } from './formats/formats.controller';
import { FormatsService } from './formats/formats.service';
import { InterviewGateway } from './interview.gateway';

@Module({
  imports: [AuthModule],
  controllers: [FormatsController, ConversationsController],
  providers: [FormatsService, ConversationsService, InterviewGateway],
  exports: [FormatsService, ConversationsService],
})
export class InterviewModule {}
