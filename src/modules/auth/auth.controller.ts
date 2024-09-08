import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UnauthorizedException,
  UseInterceptors,
} from '@nestjs/common';
import { Request } from 'express';

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
  async logout() {
    return { message: 'Logged out successfully' };
  }

  @HttpCode(HttpStatus.OK)
  @Post('login/access-token')
  async getNewToken(@Req() req: Request) {
    const refreshTokenFromCookie =
      req.cookies[this.authService.REFRESH_TOKEN_NAME];

    if (!refreshTokenFromCookie) {
      throw new UnauthorizedException('Refresh токен не действителен');
    }

    return this.authService.getNewToken(refreshTokenFromCookie);
  }
}
