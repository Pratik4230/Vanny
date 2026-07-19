import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { WsException } from '@nestjs/websockets';
import type { Socket } from 'socket.io';

export interface WsAuthUser {
  sub: string;
  email: string;
}

export type AuthenticatedSocket = Omit<Socket, 'data'> & {
  data: {
    user?: WsAuthUser;
  };
};

@Injectable()
export class WsJwtGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const client = context.switchToWs().getClient<AuthenticatedSocket>();
    const token = this.extractToken(client);

    if (!token) throw new WsException('No token provided');

    try {
      client.data.user = this.jwt.verify<WsAuthUser>(token, {
        secret: this.config.getOrThrow<string>('JWT_ACCESS_SECRET'),
      });
    } catch {
      throw new WsException('Invalid or expired access token');
    }

    return true;
  }

  private extractToken(client: Pick<Socket, 'handshake'>): string | undefined {
    const authToken: unknown = client.handshake.auth.token;

    if (typeof authToken === 'string' && authToken.length > 0) {
      return authToken;
    }

    const [type, token] =
      client.handshake.headers.authorization?.split(' ') ?? [];

    return type === 'Bearer' ? token : undefined;
  }
}
