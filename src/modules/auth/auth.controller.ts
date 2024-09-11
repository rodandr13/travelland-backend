import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseInterceptors,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request, Response } from 'express';

import { AuthService } from './auth.service';
import { AuthDto } from './dto/auth.dto';
import { TokenInterceptor } from '../../interceptors/token.interceptor';
import { UserService } from '../user/user.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly jwtService: JwtService,
    private readonly userService: UserService,
  ) {}

  @UseInterceptors(TokenInterceptor)
  @Post('login')
  async login(@Body() dto: AuthDto) {
    return await this.authService.login(dto);
  }

  @Get('me')
  async getMe(@Req() req: Request) {
    const accessToken = req.cookies['accessToken'];
    console.log(req);
    if (!accessToken) {
      throw new UnauthorizedException('Необходима авторизация');
    }

    const userId = this.jwtService.verify(accessToken).id;

    return await this.userService.getById(userId);
  }

  @UseInterceptors(TokenInterceptor)
  @Post('register')
  async register(@Body() dto: AuthDto) {
    return await this.authService.register(dto);
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
