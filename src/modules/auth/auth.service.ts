import {
  BadRequestException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';

import { AuthDto } from './dto/auth.dto';
import { CreateUserDto } from '../user/dto/create-user.dto';
import { UserService } from '../user/user.service';
import { AuthResponse, TokenResponse } from './response/auth.response';
import { PrismaService } from '../prisma/prisma.service';
import { SessionService } from '../session/session.service';
import { TokenService } from '../token/token.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly userService: UserService,
    private readonly prismaService: PrismaService,
    private readonly sessionService: SessionService,
    private readonly tokenService: TokenService,
  ) {}

  async login(dto: AuthDto): Promise<AuthResponse> {
    const user = await this.validate(dto);
    const tokens = await this.tokenService.issueTokens(user.id);

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
    const tokens = await this.tokenService.issueTokens(user.id);

    await this.sessionService.createSession(user.id, tokens.refreshToken);

    return {
      ...tokens,
      id: user.id,
      first_name: user.first_name,
      email: user.email,
      phone_number: user.phone_number,
    };
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
    const tokenData =
      await this.tokenService.validateRefreshToken(refreshToken);
    if (!tokenData) {
      throw new UnauthorizedException(
        'Недействительный или истёкший refresh токен',
      );
    }

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

    const tokens = await this.tokenService.issueTokens(session.user_id);

    await this.sessionService.updateSession(refreshToken, tokens.refreshToken);

    return tokens;
  }

  async logout(refreshToken: string): Promise<void> {
    const tokenData =
      await this.tokenService.validateRefreshToken(refreshToken);

    if (!tokenData) {
      throw new UnauthorizedException(
        'Недействительный или истёкший refresh токен',
      );
    }

    await this.sessionService.invalidateSession(refreshToken);
  }

  async invalidateAllUserSessions(userId: number): Promise<void> {
    await this.prismaService.session.updateMany({
      where: { user_id: userId },
      data: { is_active: false },
    });
  }
}
