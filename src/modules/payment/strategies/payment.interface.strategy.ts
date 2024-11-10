import { PaymentDataDto } from '../dto/payment.dto';
import {
  GpwebpayPaymentResultResponse,
  PaymentInitiateResponse,
  PaymentResponseParams,
} from '../types';

export interface PaymentInitiateStrategy {
  initiatePayment(
    paymentData: PaymentDataDto,
  ): Promise<PaymentInitiateResponse>;
}

export interface PaymentResultStrategy {
  processPaymentResult(
    params: PaymentResponseParams,
  ): Promise<GpwebpayPaymentResultResponse>;
}
