import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'node:fs';

import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';

@Module({
  providers: [
    {
      provide: 'PRIVATE_KEY',
      useFactory: async (configService: ConfigService) => {
        const keyPath = configService.get('GP_PAYMENT_KEY');
        return fs.promises.readFile(keyPath, 'utf8');
      },
      inject: [ConfigService],
    },
    {
      provide: 'PUBLIC_KEY',
      useFactory: async (configService: ConfigService) => {
        const keyPath = configService.get('GP_PUBLIC_KEY');
        return fs.promises.readFile(keyPath, 'utf8');
      },
      inject: [ConfigService],
    },
    PaymentService,
  ],
  controllers: [PaymentController],
})
export class PaymentModule {}
