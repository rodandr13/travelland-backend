import { Injectable } from '@nestjs/common';
import { PaymentMethod } from '@prisma/client';

import { CardPaymentStrategy } from './strategies/card-payment.strategy';
import { CashPaymentStrategy } from './strategies/cash-payment.strategy';
import {
  PaymentInitiateStrategy,
  PaymentResultStrategy,
} from './strategies/payment.interface.strategy';
import { PrepaymentStrategy } from './strategies/prepayment.strategy';

@Injectable()
export class PaymentStrategyFactory {
  constructor(
    private readonly gpwebpayStrategy: CardPaymentStrategy,
    private readonly cashStrategy: CashPaymentStrategy,
    private readonly prepaymentStrategy: PrepaymentStrategy,
  ) {}

  public getInitiateStrategy(method: PaymentMethod): PaymentInitiateStrategy {
    switch (method) {
      case PaymentMethod.CASH:
        return this.cashStrategy;
      case PaymentMethod.CARD:
        return this.gpwebpayStrategy;
      case PaymentMethod.PREPAYMENT:
        return this.prepaymentStrategy;
      default:
        throw new Error('Unsupported payment method');
    }
  }

  public getResultStrategy(method: PaymentMethod): PaymentResultStrategy {
    switch (method) {
      case PaymentMethod.CARD:
        return this.gpwebpayStrategy;
      case PaymentMethod.PREPAYMENT:
        return this.prepaymentStrategy;
      default:
        throw new Error('Unsupported payment method for processing result');
    }
  }
}
