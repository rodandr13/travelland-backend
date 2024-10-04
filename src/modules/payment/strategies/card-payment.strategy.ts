import { Injectable } from '@nestjs/common';

import { PaymentStrategy } from './payment.strategy';
import { GpwebpayService } from '../gpwebpay.service';
import { PaymentDataDto } from '../payment.dto';
import { PaymentResponseParams } from '../types';

@Injectable()
export class CardPaymentStrategy implements PaymentStrategy {
  constructor(private readonly paymentService: GpwebpayService) {}

  async initiatePayment(paymentData: PaymentDataDto): Promise<string> {
    return this.paymentService.getPaymentUrl(paymentData);
  }

  async processPaymentResult(params: PaymentResponseParams): Promise<void> {
    return this.paymentService.processPaymentResult(params);
  }
}
