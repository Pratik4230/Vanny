import { createParamDecorator, ExecutionContext } from '@nestjs/common';

type JwtUser = { sub: string; email: string };

export const CurrentUser = createParamDecorator(
  (field: keyof JwtUser | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<{ user: JwtUser }>();
    return field ? request.user[field] : request.user;
  },
);
