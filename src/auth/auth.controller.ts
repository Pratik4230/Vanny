import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { CookieOptions, Request, Response } from 'express';
import { Public } from 'src/common/decorators/public.decorator';
import {
  REFRESH_TOKEN_COOKIE,
  REFRESH_TOKEN_TTL_SECONDS,
} from './auth.constants';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

type RequestWithCookies = Omit<Request, 'cookies'> & {
  cookies: Record<string, string | undefined>;
};

@Public()
@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly config: ConfigService,
  ) {}

  @Post('register')
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const tokens = await this.auth.register(dto);
    return this.setSession(response, tokens);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const tokens = await this.auth.login(dto);
    return this.setSession(response, tokens);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Req() request: RequestWithCookies,
    @Res({ passthrough: true }) response: Response,
  ) {
    const refreshToken = request.cookies[REFRESH_TOKEN_COOKIE];
    if (!refreshToken) throw new UnauthorizedException('No refresh token');

    const tokens = await this.auth.refresh(refreshToken);
    return this.setSession(response, tokens);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(
    @Req() request: RequestWithCookies,
    @Res({ passthrough: true }) response: Response,
  ) {
    const refreshToken = request.cookies[REFRESH_TOKEN_COOKIE];

    if (refreshToken) await this.auth.logout(refreshToken);

    response.clearCookie(REFRESH_TOKEN_COOKIE, this.refreshCookieOptions());
  }

  private setSession(
    response: Response,
    tokens: { accessToken: string; refreshToken: string },
  ) {
    response.cookie(
      REFRESH_TOKEN_COOKIE,
      tokens.refreshToken,
      this.refreshCookieOptions(),
    );

    return { accessToken: tokens.accessToken };
  }

  private refreshCookieOptions(): CookieOptions {
    return {
      httpOnly: true,
      secure: this.config.get<string>('NODE_ENV') === 'production',
      sameSite: 'lax',
      path: '/api/v1/auth',
      maxAge: REFRESH_TOKEN_TTL_SECONDS * 1000,
    };
  }
}
