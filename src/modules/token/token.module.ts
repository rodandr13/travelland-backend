import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';

import { TokenService } from './token.service';
import { SessionModule } from '../session/session.module';

@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [SessionModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('jwt.secretAccess'),
        signOptions: {
          expiresIn:
            configService.get<string>('JWT_ACCESS_EXPIRES_IN') || '30m',
        },
      }),
    }),
  ],
  exports: [TokenService],
  providers: [TokenService],
})
export class TokenModule {}
