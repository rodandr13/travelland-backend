import { Injectable } from '@nestjs/common';

import { PaymentInterfaceStrategy } from './payment.interface.strategy';
import { PaymentDataDto } from '../payment.dto';
import { PaymentResponseParams } from '../types';

@Injectable()
export class CashPaymentStrategy implements PaymentInterfaceStrategy {
  async initiatePayment(paymentData: PaymentDataDto): Promise<void> {
    console.log(paymentData);
  }

  async processPaymentResult(params: PaymentResponseParams) {
    console.log(params);
    return { token: 'test' };
  }
}
