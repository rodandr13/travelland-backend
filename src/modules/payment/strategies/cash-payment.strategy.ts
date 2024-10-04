import { Injectable } from '@nestjs/common';

import { PaymentStrategy } from './payment.strategy';
import { PaymentDataDto } from '../payment.dto';
import { PaymentResponseParams } from '../types';

@Injectable()
export class CashPaymentStrategy implements PaymentStrategy {
  async initiatePayment(paymentData: PaymentDataDto): Promise<void> {
    console.log(paymentData);
  }

  async processPaymentResult(params: PaymentResponseParams): Promise<void> {
    console.log(params);
  }
}
