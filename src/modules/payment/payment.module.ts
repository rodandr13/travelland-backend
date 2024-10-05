import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'node:fs';

import { GpwebpayService } from './gpwebpay.service';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { PaymentStrategyFactory } from './paymentStrategyFactory';
import { CardPaymentStrategy } from './strategies/card-payment.strategy';
import { CashPaymentStrategy } from './strategies/cash-payment.strategy';

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
        const keyPath = configService.get('GP_TEST_PUBLIC_KEY');
        return fs.promises.readFile(keyPath, 'utf8');
      },
      inject: [ConfigService],
    },
    GpwebpayService,
    PaymentService,
    PaymentStrategyFactory,
    CardPaymentStrategy,
    CashPaymentStrategy,
  ],
  controllers: [PaymentController],
  exports: [PaymentService],
})
export class PaymentModule {}
