import {
  PaymentInitiateStrategy,
  PaymentResultStrategy,
} from './payment.interface.strategy';
import { PaymentDataDto } from '../dto/payment.dto';
import { GpwebpayService } from '../gpwebpay.service';
import { GpwebpayPaymentResultResponse, PaymentResponseParams } from '../types';

export class PrepaymentStrategy
  implements PaymentInitiateStrategy, PaymentResultStrategy
{
  constructor(private readonly paymentService: GpwebpayService) {}

  async initiatePayment(paymentData: PaymentDataDto) {
    const paymentUrl = this.paymentService.getPaymentUrl(paymentData);
    return {
      token: paymentData.token,
      url: paymentUrl,
    };
  }

  async processPaymentResult(
    params: PaymentResponseParams,
  ): Promise<GpwebpayPaymentResultResponse> {
    return this.paymentService.processPaymentResult(params);
  }
}
