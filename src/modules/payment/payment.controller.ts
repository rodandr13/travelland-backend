import { Body, Controller, Get, Post, Query, Res } from '@nestjs/common';
import { Response } from 'express';

import { PaymentDataDto } from './payment.dto';
import { PaymentService } from './payment.service';

@Controller('payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('initiate')
  async initiatePayment(
    @Body() paymentData: PaymentDataDto,
    @Res() res: Response,
  ) {
    await this.paymentService.initiatePaymentRedirect(paymentData, res);
  }

  @Get('return')
  async handleReturn(@Query() query, @Res() res: Response) {
    try {
      await this.paymentService.processPaymentResult(query);
      res.send('Payment successful');
    } catch (error: any) {
      res.send(`Payment failed: ${error.message}`);
    }
  }
}
