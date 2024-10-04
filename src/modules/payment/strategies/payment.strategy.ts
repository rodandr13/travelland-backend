import { PaymentDataDto } from '../payment.dto';
import { PaymentResponseParams } from '../types';

export interface PaymentStrategy {
  initiatePayment(paymentData: PaymentDataDto): Promise<string | void>;

  processPaymentResult(params: PaymentResponseParams): Promise<void>;
}
