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

    const formFields = Object.entries(paymentParams)
      .map(
        ([key, value]) =>
          `<input type="hidden" name="${key}" value="${value}" />`,
      )
      .join('\n');

    const htmlContent = `
      <html>
        <head><title>Redirecting...</title></head>
        <body onload="document.forms[0].submit();">
          <form action=${this.configService.get('GP_URL_PAY_REQUEST')} method="POST">
            ${formFields}
          </form>
        </body>
      </html>
    `;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(htmlContent);
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
