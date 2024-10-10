import { Injectable, NotFoundException } from '@nestjs/common';
import { PaymentMethod } from '@prisma/client';

import { PaymentDataDto } from './dto/payment.dto';
import { PaymentStrategyFactory } from './paymentStrategyFactory';
import { PaymentResponseParams, PaymentStatusResponse } from './types';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PaymentService {
  constructor(
    private readonly strategyFactory: PaymentStrategyFactory,
    private readonly prismaService: PrismaService,
  ) {}

  async initiatePayment(paymentData: PaymentDataDto): Promise<string | void> {
    const strategy = this.strategyFactory.getStrategy(
      paymentData.paymentMethod,
    );
    return strategy.initiatePayment(paymentData);
  }

  async processPaymentResult(
    paymentMethod: PaymentMethod,
    params: PaymentResponseParams,
  ) {
    const strategy = this.strategyFactory.getStrategy(paymentMethod);
    return await strategy.processPaymentResult(params);
  }

  async getStatus(token: string): Promise<PaymentStatusResponse> {
    const payment = await this.prismaService.payment.findUnique({
      where: { token },
    });

    if (!payment) {
      throw new NotFoundException('Платеж не найден');
    }

    return {
      orderId: payment.order_id,
      message: payment.result_text,
      status: payment.status,
    };
  }
}
