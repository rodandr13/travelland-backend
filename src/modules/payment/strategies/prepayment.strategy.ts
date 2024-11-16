import { Injectable } from '@nestjs/common';

import {
  PaymentInitiateStrategy,
  PaymentResultStrategy,
} from './payment.interface.strategy';
import { PaymentDataDto } from '../dto/payment.dto';
import { GpwebpayService } from '../gpwebpay.service';
import {
  GpwebpayPaymentResultResponse,
  PaymentInitiateResponse,
  PaymentResponseParams,
} from '../types';

@Injectable()
export class PrepaymentStrategy
  implements PaymentInitiateStrategy, PaymentResultStrategy
{
  constructor(private readonly gpwebpayService: GpwebpayService) {}

  async initiatePayment(
    paymentData: PaymentDataDto,
  ): Promise<PaymentInitiateResponse> {
    const paymentUrl = this.gpwebpayService.getPaymentUrl(paymentData);
    return {
      token: paymentData.token,
      url: paymentUrl,
    };
  }

  async processPaymentResult(
    params: PaymentResponseParams,
  ): Promise<GpwebpayPaymentResultResponse> {
    return this.gpwebpayService.processPaymentResult(params);
  }
}
