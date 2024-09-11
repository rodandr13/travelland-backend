import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseInterceptors,
} from '@nestjs/common';
import { Request, Response } from 'express';

import { AuthService } from './auth.service';
import { AuthDto } from './dto/auth.dto';
import { TokenInterceptor } from '../../interceptors/token.interceptor';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @UseInterceptors(TokenInterceptor)
  @Post('login')
  async login(@Body() dto: AuthDto) {
    return this.authService.login(dto);
  }

  @UseInterceptors(TokenInterceptor)
  @Post('register')
  async register(@Body() dto: AuthDto) {
    return this.authService.register(dto);
  }

  @Post('logout')
  async logout(@Res() response: Response) {
    response.clearCookie('accessToken', {
      httpOnly: true,
      domain: process.env.COOKIE_DOMAIN || 'localhost',
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'none',
    });

    response.clearCookie('refreshToken', {
      httpOnly: true,
      domain: process.env.COOKIE_DOMAIN || 'localhost',
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'none',
    });
    return { message: 'Logged out successfully' };
  }

  @HttpCode(HttpStatus.OK)
  @Post('login/access-token')
  async getNewToken(@Req() req: Request) {
    const refreshTokenFromCookie = req.cookies['refreshToken'];

    if (!refreshTokenFromCookie) {
      throw new UnauthorizedException('Refresh токен не действителен');
    }

    return this.authService.getNewToken(refreshTokenFromCookie);
  }
}
