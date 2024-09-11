import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Response } from 'express';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class TokenInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp();
    const response = ctx.getResponse<Response>();

    return next.handle().pipe(
      tap((data) => {
        const { refreshToken, accessToken } = data;
        if (refreshToken && accessToken) {
          const expireAccess = new Date();
          expireAccess.setMinutes(expireAccess.getMinutes() + 15);

          const expireRefresh = new Date();
          expireRefresh.setDate(expireRefresh.getDate() + 7);

          response.cookie('accessToken', accessToken, {
            httpOnly: true,
            domain: process.env.COOKIE_DOMAIN || 'localhost',
            expires: expireAccess,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
          });

          response.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            domain: process.env.COOKIE_DOMAIN || 'localhost',
            expires: expireRefresh,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
          });

          delete data.refreshToken;
          delete data.accessToken;
        }
      }),
    );
  }
}
