import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

import { AuthDto } from './dto/auth.dto';
import { CreateUserDto } from '../user/dto/create-user.dto';
import { UserService } from '../user/user.service';
import { AuthResponse, TokenResponse } from './response/auth.response';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly jwt: JwtService,
    private readonly userService: UserService,
    private readonly configService: ConfigService,
  ) {}

  async login(dto: AuthDto): Promise<AuthResponse> {
    const { password_hash, ...user } = await this.validate(dto);
    void password_hash;

    const tokens = await this.issueTokens(user.id);

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
    const { password_hash, ...user } = await this.userService.create(dto);
    void password_hash;

    const tokens = await this.issueTokens(user.id);

    return {
      ...tokens,
      id: user.id,
      first_name: user.first_name,
      email: user.email,
      phone_number: user.phone_number,
    };
  }

  private async issueTokens(userId: number) {
    const data = { id: userId };
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
    if (!user) throw new NotFoundException('Пользователь не найден');

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
    let result;
    try {
      result = await this.jwt.verifyAsync(refreshToken);
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error('Invalid refresh token', error.stack);
      } else {
        this.logger.error('Invalid refresh token', JSON.stringify(error));
      }
      throw new UnauthorizedException('Недействительный refresh токен');
    }

    const user = await this.userService.getById(result.id);
    if (!user) {
      this.logger.warn(`User with id ${result.id} not found`);
      throw new UnauthorizedException('Пользователь не найден');
    }
    const tokens = this.issueTokens(user.id);

    return {
      ...tokens,
    };
  }
}
