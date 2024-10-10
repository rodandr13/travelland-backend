import { Injectable } from '@nestjs/common';

import { PaymentInterfaceStrategy } from './payment.interface.strategy';
import { GpwebpayService } from '../gpwebpay.service';
import { PaymentDataDto } from '../dto/payment.dto';
import { PaymentResponseParams, PaymentResultResponse } from '../types';

@Injectable()
export class CardPaymentStrategy implements PaymentInterfaceStrategy {
  constructor(private readonly paymentService: GpwebpayService) {}

  async initiatePayment(paymentData: PaymentDataDto): Promise<string> {
    return this.paymentService.getPaymentUrl(paymentData);
  }

  async processPaymentResult(
    params: PaymentResponseParams,
  ): Promise<PaymentResultResponse> {
    return this.paymentService.processPaymentResult(params);
  }
}
