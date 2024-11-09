import { Injectable, NotFoundException } from '@nestjs/common';
import { Order, Payment, PaymentMethod, Prisma } from '@prisma/client';

import { PaymentDataDto } from './dto/payment.dto';
import { PaymentStrategyFactory } from './paymentStrategyFactory';
import {
  PaymentInitiateResponse,
  PaymentResponseParams,
  PaymentStatusResponse,
} from './types';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PaymentService {
  constructor(
    private readonly strategyFactory: PaymentStrategyFactory,
    private readonly prismaService: PrismaService,
  ) {}

  async processPayment(
    order: Order,
    paymentMethod: PaymentMethod,
    totalAmount: Prisma.Decimal,
    email: string,
    userId: number,
  ): Promise<PaymentInitiateResponse> {
    const payment = await this.createPaymentRecord(order, totalAmount, userId);

    const paymentData: PaymentDataDto = {
      paymentMethod,
      orderNumber: Number(order.id),
      paymentNumber: payment.transaction_id,
      email,
      amount: this.convertAmountToCents(totalAmount),
      token: payment.token,
    };
    const strategy = this.strategyFactory.getStrategy(
      paymentData.paymentMethod,
    );
    return await strategy.initiatePayment(paymentData);
  }

  private async createPaymentRecord(
    order: Order,
    amount: Prisma.Decimal,
    userId: number,
  ): Promise<Payment> {
    return this.prismaService.payment.create({
      data: {
        order: { connect: { id: order.id } },
        user: { connect: { id: userId } },
        amount,
        method: order.payment_method,
      },
    });
  }

  private convertAmountToCents(amount: Prisma.Decimal): number {
    return amount
      .mul(100)
      .toDecimalPlaces(0, Prisma.Decimal.ROUND_HALF_UP)
      .toNumber();
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

    let message: string = '';

    if (!payment) {
      throw new NotFoundException('Платеж не найден');
    }

    if (payment.prcode === '14' && payment.srcode === '0') {
      message = 'Ошибка при выполнении оплаты. Дубликат номера.';
    }

    if (payment.prcode === '50' && payment.srcode === '0') {
      message = 'Оплата отменена пользователем.';
    }

    return {
      order_id: payment.order_id,
      result_text: payment.result_text,
      status: payment.status,
      payment_method: payment.method,
      message,
    };
  }
}
