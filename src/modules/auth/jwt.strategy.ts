import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { Strategy } from 'passport-jwt';

import { UserService } from '../user/user.service';

const extractJwtFromCookieOrHeader = (req: Request): string | null => {
  let accessToken = null;

  if (req && req.cookies && req.cookies['accessToken']) {
    accessToken = req.cookies['accessToken'];
  }

  if (!accessToken && req.headers.authorization) {
    const authHeader = req.headers.authorization;
    if (authHeader.startsWith('Bearer ')) {
      accessToken = authHeader.substring(7, authHeader.length);
    }
  }

  return accessToken;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly userService: UserService,
  ) {
    super({
      jwtFromRequest: extractJwtFromCookieOrHeader,
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('jwt.secretAccess'),
    });
  }

  async validate({ id }: { id: number }) {
    const user = await this.userService.getById(id);
    if (!user) {
      throw new UnauthorizedException('Пользователь не найден');
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
}
