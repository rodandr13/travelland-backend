import { PaymentDataDto } from '../dto/payment.dto';
import {
  PaymentInitiateResponse,
  PaymentResponseParams,
  PaymentResultResponse,
} from '../types';

export interface PaymentInterfaceStrategy {
  initiatePayment(
    paymentData: PaymentDataDto,
  ): Promise<PaymentInitiateResponse>;

  processPaymentResult(
    params: PaymentResponseParams,
  ): Promise<PaymentResultResponse>;
}
