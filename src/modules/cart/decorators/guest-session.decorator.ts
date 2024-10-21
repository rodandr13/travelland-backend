import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const GuestSession = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string | undefined => {
    const request = ctx.switchToHttp().getRequest();
    return request.cookies['guest_session_id'];
  },
);
