import { Injectable } from '@nestjs/common';

import { PaymentInterfaceStrategy } from './payment.interface.strategy';
import { PaymentDataDto } from '../dto/payment.dto';
import { GpwebpayService } from '../gpwebpay.service';
import {
  PaymentInitiateResponse,
  PaymentResponseParams,
  PaymentResultResponse,
} from '../types';

@Injectable()
export class CardPaymentStrategy implements PaymentInterfaceStrategy {
  constructor(private readonly paymentService: GpwebpayService) {}

  async initiatePayment(
    paymentData: PaymentDataDto,
  ): Promise<PaymentInitiateResponse> {
    const paymentUrl = this.paymentService.getPaymentUrl(paymentData);
    return {
      token: paymentData.token,
      url: paymentUrl,
    };
  }

  async processPaymentResult(
    params: PaymentResponseParams,
  ): Promise<PaymentResultResponse> {
    return this.paymentService.processPaymentResult(params);
  }
}
