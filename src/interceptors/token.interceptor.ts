import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class TokenInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    return next.handle().pipe(
      tap((data) => {
        if (request.url.includes('logout')) {
          response.clearCookie('refreshToken', {
            httpOnly: true,
            domain: process.env.COOKIE_DOMAIN || 'localhost',
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'none',
          });
          return;
        }

        const { refreshToken } = data;
        if (refreshToken) {
          const expireIn = new Date();
          expireIn.setDate(expireIn.getDate() + 1);

          response.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            domain: process.env.COOKIE_DOMAIN || 'localhost',
            expires: expireIn,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'none',
          });

          delete data.refreshToken;
        }
      }),
    );
  }
}
