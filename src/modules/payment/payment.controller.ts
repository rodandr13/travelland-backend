import { Body, Controller, Get, Post, Query, Redirect } from '@nestjs/common';
import { PaymentMethod } from '@prisma/client';

import { PaymentDataDto } from './payment.dto';
import { PaymentService } from './payment.service';
import { PaymentResponseParams } from './types';

@Controller('payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('initiate')
  async initiatePayment(@Body() paymentData: PaymentDataDto) {
    return await this.paymentService.initiatePayment(paymentData);
  }

  @Get('return')
  @Redirect()
  async handleReturn(@Query() query: PaymentResponseParams) {
    const { token } = await this.paymentService.processPaymentResult(
      PaymentMethod.CARD,
      query,
    );
    return {
      url: `https://traventico.com/payment?token=${token}`,
    };
  }
}
