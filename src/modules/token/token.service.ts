import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class TokenService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async issueTokens(userId: number) {
    const data = { id: userId };
    const accessToken = this.jwtService.sign(data, {
      expiresIn: this.configService.get<string>('jwt.accessExpiresIn') || '30m',
    });
    const refreshToken = this.jwtService.sign(data, {
      expiresIn: this.configService.get<string>('jwt.refreshExpiresIn') || '7d',
      secret: this.configService.get<string>('jwt.secretRefresh'),
    });

    return { accessToken, refreshToken };
  }

  async validateRefreshToken(token: string) {
    return this.jwtService.verify(token, {
      secret: this.configService.get<string>('jwt.secretRefresh'),
    });
  }
}
