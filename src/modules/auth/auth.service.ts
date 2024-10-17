import {
  BadRequestException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

import { AuthDto } from './dto/auth.dto';
import { CreateUserDto } from '../user/dto/create-user.dto';
import { UserService } from '../user/user.service';
import { AuthResponse, TokenResponse } from './response/auth.response';
import { PrismaService } from '../prisma/prisma.service';
import { SessionService } from '../session/session.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly jwt: JwtService,
    private readonly userService: UserService,
    private readonly configService: ConfigService,
    private readonly prismaService: PrismaService,
    private readonly sessionService: SessionService,
  ) {}

  async login(dto: AuthDto): Promise<AuthResponse> {
    const user = await this.validate(dto);
    const tokens = await this.issueTokens(user.id);

    await this.sessionService.createSession(user.id, tokens.refreshToken);

    return {
      ...tokens,
      id: user.id,
      first_name: user.first_name,
      email: user.email,
      phone_number: user.phone_number,
    };
  }

  async register(dto: CreateUserDto): Promise<AuthResponse> {
    const isExists = await this.userService.getByEmail(dto.email);
    if (isExists) {
      throw new BadRequestException(
        'Пользователь с таким email уже существует',
      );
    }
    const user = await this.userService.create(dto);
    const tokens = await this.issueTokens(user.id);

    await this.sessionService.createSession(user.id, tokens.refreshToken);

    return {
      ...tokens,
      id: user.id,
      first_name: user.first_name,
      email: user.email,
      phone_number: user.phone_number,
    };
  }

  private async issueTokens(userId: number) {
    const data = { id: userId, iat: Math.floor(Date.now() / 1000) };
    const accessToken = this.jwt.sign(data, {
      expiresIn:
        this.configService.get<string>('JWT_ACCESS_EXPIRES_IN') || '30m',
    });
    const refreshToken = this.jwt.sign(data, {
      expiresIn:
        this.configService.get<string>('JWT_REFRESH_EXPIRES_IN') || '7d',
    });

    return { accessToken, refreshToken };
  }

  private async validate(dto: AuthDto) {
    const user = await this.userService.getByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedException('Неверный email или пароль');
    }

    const isValid = await this.comparePassword(
      dto.password,
      user.password_hash,
    );
    if (!isValid) throw new UnauthorizedException('Неверный email или пароль');

    return user;
  }

  private async comparePassword(
    password: string,
    storedPasswordHash: string,
  ): Promise<boolean> {
    return bcrypt.compare(password, storedPasswordHash);
  }

  async getNewToken(refreshToken: string): Promise<TokenResponse> {
    const session =
      await this.sessionService.getSessionByRefreshToken(refreshToken);

    if (!session) {
      throw new UnauthorizedException('Недействительный refresh токен');
    }

    if (!session.is_active) {
      throw new UnauthorizedException(
        'Сессия деактивирована. Пожалуйста, выполните вход снова.',
      );
    }

    if (session.expires_at <= new Date()) {
      await this.sessionService.invalidateSession(refreshToken);
      throw new UnauthorizedException(
        'Срок действия сессии истек. Пожалуйста, выполните вход снова.',
      );
    }

    const tokens = await this.issueTokens(session.user_id);

    await this.sessionService.updateSession(refreshToken, tokens.refreshToken);

    return tokens;
  }

  async logout(refreshToken: string): Promise<void> {
    await this.sessionService.invalidateSession(refreshToken);
  }

  async invalidateAllUserSessions(userId: number): Promise<void> {
    await this.prismaService.session.updateMany({
      where: { user_id: userId },
      data: { is_active: false },
    });
  }
}
