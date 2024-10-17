import {
  Body,
  Controller,
  Get,
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
import { CreateUserDto } from '../user/dto/create-user.dto';
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

    if (!accessToken) {
      throw new UnauthorizedException('Необходима авторизация');
    }

    try {
      const userId = this.jwtService.verify(accessToken).id;
      return await this.userService.getById(userId);
    } catch (error: any) {
      if (error.name === 'TokenExpiredError') {
        throw new UnauthorizedException('Срок действия токена истёк');
      } else if (error.name === 'JsonWebTokenError') {
        throw new UnauthorizedException('Недействительный токен');
      }
      throw new UnauthorizedException('Ошибка авторизации');
    }
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
