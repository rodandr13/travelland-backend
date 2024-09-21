import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

import { AuthDto } from './dto/auth.dto';
import { UserService } from '../user/user.service';

@Injectable()
export class AuthService {
  constructor(
    private jwt: JwtService,
    private userService: UserService,
  ) {}

  async login(dto: AuthDto) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password_hash, ...user } = await this.validate(dto);
    const tokens = this.issueTokens(user.id);

    return {
      ...tokens,
    };
  }

  async register(dto: AuthDto) {
    const isExists = await this.userService.getByEmail(dto.email);
    if (isExists) {
      throw new BadRequestException(
        'Пользователь с таким email уже существует',
      );
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password_hash, ...user } = await this.userService.create(dto);
    const tokens = this.issueTokens(user.id);

    return {
      ...tokens,
    };
  }

  private issueTokens(userId: number) {
    const data = { id: userId };
    const accessToken = this.jwt.sign(data, {
      expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '30m',
    });
    const refreshToken = this.jwt.sign(data, {
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
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

  async getNewToken(refreshToken: string) {
    let result;
    try {
      result = await this.jwt.verifyAsync(refreshToken);
    } catch (error) {
      console.log(error);
      throw new UnauthorizedException('Недействительный refresh токен');
    }

    const user = await this.userService.getById(result.id);
    if (!user) {
      throw new UnauthorizedException('Пользователь не найден');
    }
    const tokens = this.issueTokens(user.id);

    return {
      ...tokens,
    };
  }
}
