import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

import { TokenPair, TokenPayload } from './types';

@Injectable()
export class TokenService {
  private readonly logger = new Logger(TokenService.name);
  private readonly accessTokenExpiresIn: string;
  private readonly refreshTokenExpiresIn: string;
  private readonly refreshTokenSecret: string;

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    this.accessTokenExpiresIn = this.configService.get<string>(
      'jwt.accessExpiresIn',
      '30m',
    );
    this.refreshTokenExpiresIn = this.configService.get<string>(
      'jwt.refreshExpiresIn',
      '7d',
    );
    this.refreshTokenSecret = this.configService.get<string>(
      'jwt.secretRefresh',
      'fallbackSecret',
    );
  }

  async issueTokens(userId: number): Promise<TokenPair> {
    const payload: TokenPayload = { id: userId };

    const [accessToken, refreshToken] = await Promise.all([
      this.generateAccessToken(payload),
      this.generateRefreshToken(payload),
    ]);

    return { accessToken, refreshToken };
  }

  async validateRefreshToken(token: string): Promise<TokenPayload> {
    try {
      return await this.jwtService.verifyAsync<TokenPayload>(token, {
        secret: this.refreshTokenSecret,
      });
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(
          `Ошибка при валидации refresh токена: ${error.message}`,
          error.stack,
        );
      }
      throw new Error('Недействительный refresh token');
    }
  }

  private async generateAccessToken(payload: TokenPayload): Promise<string> {
    return this.jwtService.signAsync(payload, {
      expiresIn: this.accessTokenExpiresIn,
    });
  }

  private async generateRefreshToken(payload: TokenPayload): Promise<string> {
    return this.jwtService.signAsync(payload, {
      expiresIn: this.refreshTokenExpiresIn,
      secret: this.refreshTokenSecret,
    });
  }
}
