import { PaymentDataDto } from '../dto/payment.dto';
import { PaymentResponseParams, PaymentResultResponse } from '../types';

export interface PaymentInterfaceStrategy {
  initiatePayment(paymentData: PaymentDataDto): Promise<string | void>;

  processPaymentResult(
    params: PaymentResponseParams,
  ): Promise<PaymentResultResponse>;
}
