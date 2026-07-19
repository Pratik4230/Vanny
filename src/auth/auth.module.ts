import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { UsersModule } from 'src/users/users.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt.guard';
import { WsJwtGuard } from './guards/ws-jwt.guard';

@Module({
  imports: [UsersModule, JwtModule.register({})],
  providers: [AuthService, JwtAuthGuard, WsJwtGuard],
  controllers: [AuthController],
  exports: [JwtAuthGuard, WsJwtGuard, JwtModule],
})
export class AuthModule {}
