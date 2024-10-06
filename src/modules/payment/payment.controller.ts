import { Body, Controller, Get, Post, Query, Redirect } from '@nestjs/common';
import { PaymentMethod } from '@prisma/client';

import { PaymentDataDto } from './payment.dto';
import { PaymentService } from './payment.service';

@Controller('payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('initiate')
  async initiatePayment(@Body() paymentData: PaymentDataDto) {
    return await this.paymentService.initiatePayment(paymentData);
  }

  @Get('return')
  @Redirect()
  async handleReturn(@Query() query) {
    try {
      const result = await this.paymentService.processPaymentResult(
        PaymentMethod.CARD,
        query,
      );
      const { status, message } = result;
      const encodedMessage = encodeURIComponent(message);
      return {
        url: `https://traventico.com/payment-result?status=${status}&message=${encodedMessage}`,
      };
    } catch {
      const errorMessage = encodeURIComponent('An unexpected error occurred');
      return {
        url: `https://traventico.com/payment-result?status=failure&message=${errorMessage}`,
      };
    }
  }
}
