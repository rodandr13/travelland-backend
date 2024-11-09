import { Injectable } from '@nestjs/common';

import { PaymentInterfaceStrategy } from './payment.interface.strategy';
import { PaymentDataDto } from '../dto/payment.dto';
import { PaymentInitiateResponse, PaymentResponseParams } from '../types';

@Injectable()
export class CashPaymentStrategy implements PaymentInterfaceStrategy {
  async initiatePayment(
    paymentData: PaymentDataDto,
  ): Promise<PaymentInitiateResponse> {
    return {
      token: paymentData.token,
    };
  }

  async processPaymentResult(params: PaymentResponseParams) {
    console.log(params);
    return { token: 'test' };
  }
}
