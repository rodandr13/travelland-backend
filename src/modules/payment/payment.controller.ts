import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Post,
  Query,
  Redirect,
} from '@nestjs/common';
import { PaymentMethod } from '@prisma/client';

import { PaymentDataDto } from './payment.dto';
import { PaymentService } from './payment.service';

@Controller('payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('initiate')
  @Redirect()
  async initiatePayment(@Body() paymentData: PaymentDataDto) {
    const url = await this.paymentService.initiatePayment(paymentData);
    return { url };
  }

  @Get('return')
  async handleReturn(@Query() query) {
    try {
      await this.paymentService.processPaymentResult(PaymentMethod.CARD, query);
      return 'Payment successful';
    } catch (error: any) {
      throw new HttpException(
        `Payment failed: ${error.message}`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
