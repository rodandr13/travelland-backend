import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class GuestSessionMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    if (!req.cookies['guest_session_id']) {
      const guestSessionId = uuidv4();
      res.cookie('guest_session_id', guestSessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 30 * 24 * 60 * 60 * 1000,
        sameSite: 'lax',
      });
      req.cookies['guest_session_id'] = guestSessionId;
    }
    next();
  }
}
