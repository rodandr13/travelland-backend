import { Body, Controller, Get, Post, Query, Res } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';

import { PaymentService } from './payment.service';

@Controller('payment')
export class PaymentController {
  constructor(
    private readonly paymentService: PaymentService,
    private readonly configService: ConfigService,
  ) {}

  @Post('initiate')
  async initiatePayment(@Body() paymentData: any, @Res() res: Response) {
    const paymentParams = this.paymentService.buildPaymentRequest(paymentData);
    const queryParams = new URLSearchParams(paymentParams).toString();
    const redirectUrl = `${this.configService.get('GP_URL_PAY_REQUEST')}?${queryParams}`;

    res.redirect(redirectUrl);
  }

  @Get('return')
  async handleReturn(@Query() query, @Res() res: Response) {
    console.log('TEST');
    try {
      await this.paymentService.processPaymentResult(query);
      res.send('Payment successful');
    } catch (error) {
      res.send('Payment failed');
    }
  }

  @Post('notify')
  async handleNotification(@Body() body) {
    await this.paymentService.handleNotification(body);
  }
}
