import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { randomBytes, scrypt, timingSafeEqual } from 'crypto';
import { promisify } from 'util';

import { RedisService } from 'src/redis/redis.service';
import { UsersService } from 'src/users/users.service';
import { REFRESH_TOKEN_TTL_SECONDS } from './auth.constants';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

const scryptAsync = promisify(scrypt);

@Injectable()
export class AuthService {
  constructor(
    private readonly users: UsersService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly redis: RedisService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.users.findByEmail(dto.email);
    if (existing) throw new ConflictException('Email already exists');

    const passwordHash = await this.hashPassword(dto.password);

    const user = await this.users.create({
      email: dto.email,
      passwordHash,
      name: dto.name,
    });

    return this.generateAndStoreTokens(user.id, user.email);
  }

  async login(dto: LoginDto) {
    const user = await this.users.findByEmail(dto.email);
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const valid = await this.verifyPassword(
      user.passwordHash ?? '',
      dto.password,
    );
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    return this.generateAndStoreTokens(user.id, user.email);
  }

  async refresh(refreshToken: string) {
    let payload: { sub: string; email: string };
    try {
      payload = this.jwt.verify<{ sub: string; email: string }>(refreshToken, {
        secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const stored = await this.redis.redis.get(`refresh_token:${payload.sub}`);
    if (stored !== refreshToken) {
      throw new UnauthorizedException('Refresh token revoked');
    }

    return this.generateAndStoreTokens(payload.sub, payload.email);
  }

  async logout(refreshToken: string) {
    try {
      const payload = this.jwt.verify<{ sub: string }>(refreshToken, {
        secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
      });

      const key = `refresh_token:${payload.sub}`;
      const stored = await this.redis.redis.get(key);

      if (stored === refreshToken) await this.redis.redis.del(key);
    } catch {
      return;
    }
  }

  private async generateAndStoreTokens(userId: string, email: string) {
    const payload = { sub: userId, email };

    const accessToken = this.jwt.sign(payload, {
      secret: this.config.getOrThrow<string>('JWT_ACCESS_SECRET'),
      expiresIn: this.config.getOrThrow('JWT_ACCESS_EXPIRY'),
    });

    const refreshToken = this.jwt.sign(payload, {
      secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
      expiresIn: this.config.getOrThrow('JWT_REFRESH_EXPIRY'),
    });

    await this.redis.redis.set(
      `refresh_token:${userId}`,
      refreshToken,
      'EX',
      REFRESH_TOKEN_TTL_SECONDS,
    );

    return { accessToken, refreshToken };
  }

  private async hashPassword(password: string): Promise<string> {
    const salt = randomBytes(16).toString('hex');
    const hash = (await scryptAsync(password, salt, 64)) as Buffer;
    return `${salt}:${hash.toString('hex')}`;
  }

  private async verifyPassword(
    stored: string,
    supplied: string,
  ): Promise<boolean> {
    const [salt, hash] = stored.split(':');
    if (!salt || !hash) return false;

    const suppliedHash = (await scryptAsync(supplied, salt, 64)) as Buffer;
    const storedHash = Buffer.from(hash, 'hex');

    return (
      storedHash.length === suppliedHash.length &&
      timingSafeEqual(storedHash, suppliedHash)
    );
  }
}
