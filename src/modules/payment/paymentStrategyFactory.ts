import { Injectable } from '@nestjs/common';
import { PaymentMethod } from '@prisma/client';

import { CardPaymentStrategy } from './strategies/card-payment.strategy';
import { CashPaymentStrategy } from './strategies/cash-payment.strategy';
import { PaymentInterfaceStrategy } from './strategies/payment.interface.strategy';

@Injectable()
export class PaymentStrategyFactory {
  constructor(
    private readonly gpwebpayStrategy: CardPaymentStrategy,
    private readonly cashStrategy: CashPaymentStrategy,
  ) {}

  public getStrategy(method: PaymentMethod): PaymentInterfaceStrategy {
    switch (method) {
      case PaymentMethod.CARD:
        return this.gpwebpayStrategy;
      case PaymentMethod.CASH:
        return this.cashStrategy;
      default:
        throw new Error('Unsupported payment provider');
    }
  }
}
