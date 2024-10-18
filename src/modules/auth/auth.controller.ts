import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request, Response } from 'express';

import { AuthService } from './auth.service';
import { CurrentUser } from './decorators/user.decorator';
import { AuthDto } from './dto/auth.dto';
import { TokenInterceptor } from '../../interceptors/token.interceptor';
import { CreateUserDto } from '../user/dto/create-user.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @UseInterceptors(TokenInterceptor)
  @Post('login')
  async login(@Body() dto: AuthDto) {
    return await this.authService.login(dto);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('me')
  async getMe(@CurrentUser() user) {
    return user;
  }

  @UseInterceptors(TokenInterceptor)
  @Post('register')
  async register(@Body() dto: CreateUserDto) {
    return await this.authService.register(dto);
  }

  @Post('logout')
  async logout(@Req() req: Request, @Res() response: Response) {
    const refreshToken = req.cookies['refreshToken'];

    if (refreshToken) {
      await this.authService.logout(refreshToken);
    }

    response.clearCookie('accessToken', {
      httpOnly: true,
      path: '/',
      domain: process.env.COOKIE_DOMAIN || 'localhost',
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'lax' : 'lax',
    });

    response.clearCookie('refreshToken', {
      httpOnly: true,
      path: '/',
      domain: process.env.COOKIE_DOMAIN || 'localhost',
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'lax' : 'lax',
    });

    return response.status(200).json({ message: 'Logged out successfully' });
  }

  @Post('refresh')
  async getNewToken(@Req() req: Request) {
    const refreshTokenFromCookie = req.cookies['refreshToken'];
    if (!refreshTokenFromCookie) {
      throw new UnauthorizedException('Refresh токен не действителен');
    }

    return this.authService.getNewToken(refreshTokenFromCookie);
  }
}
