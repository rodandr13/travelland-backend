import { Injectable } from '@nestjs/common';
import { PaymentMethod } from '@prisma/client';

import { PaymentDataDto } from './payment.dto';
import { PaymentStrategyFactory } from './paymentStrategyFactory';
import { PaymentResponseParams } from './types';

@Injectable()
export class PaymentService {
  constructor(private readonly strategyFactory: PaymentStrategyFactory) {}

  async initiatePayment(paymentData: PaymentDataDto): Promise<string | void> {
    const strategy = this.strategyFactory.getStrategy(
      paymentData.paymentMethod,
    );
    return strategy.initiatePayment(paymentData);
  }

  async processPaymentResult(
    paymentMethod: PaymentMethod,
    params: PaymentResponseParams,
  ) {
    const strategy = this.strategyFactory.getStrategy(paymentMethod);
    return await strategy.processPaymentResult(params);
  }
}
