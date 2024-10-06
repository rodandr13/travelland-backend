import { Injectable } from '@nestjs/common';

import { PaymentInterfaceStrategy } from './payment.interface.strategy';
import { PaymentDataDto } from '../payment.dto';
import { PaymentResponseParams, PaymentStatusResponse } from '../types';

@Injectable()
export class CashPaymentStrategy implements PaymentInterfaceStrategy {
  async initiatePayment(paymentData: PaymentDataDto): Promise<void> {
    console.log(paymentData);
  }

  async processPaymentResult(params: PaymentResponseParams) {
    console.log(params);
    return { status: PaymentStatusResponse.SUCCESS, message: 'Test' };
  }
}
