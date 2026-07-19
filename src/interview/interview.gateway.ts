import { UseGuards } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
} from '@nestjs/websockets';
import { WsException } from '@nestjs/websockets';
import { WsJwtGuard } from 'src/auth/guards/ws-jwt.guard';
import type { AuthenticatedSocket } from 'src/auth/guards/ws-jwt.guard';
import { Public } from 'src/common/decorators/public.decorator';
import { ConversationsService } from './conversations/conversations.service';
import { JoinConversationDto } from './dto/join-conversation.dto';

@Public()
@UseGuards(WsJwtGuard)
@WebSocketGateway({ namespace: '/interview' })
export class InterviewGateway {
  constructor(private readonly conversations: ConversationsService) {}

  @SubscribeMessage('join')
  async joinConversation(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() dto: JoinConversationDto,
  ) {
    const user = client.data.user;

    if (!user) throw new WsException('Authentication required');

    const conversation = await this.conversations.findOneForUser(
      user.sub,
      dto.conversationId,
    );

    if (conversation.status !== 'PENDING' && conversation.status !== 'ACTIVE') {
      throw new WsException(
        `Cannot join conversation in status ${conversation.status}`,
      );
    }

    await client.join(`conversation:${conversation.id}`);

    const payload = { conversationId: conversation.id };
    client.emit('conversation.ready', payload);

    return payload;
  }
}
