import { Injectable, NotFoundException } from '@nestjs/common';
import {
  CartStatus,
  Order,
  OrderStatus,
  Payment,
  PaymentMethod,
  PaymentStatus,
  Prisma,
} from '@prisma/client';

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
    let paymentAmount = totalAmount;

    if (paymentMethod === PaymentMethod.PREPAYMENT) {
      paymentAmount = totalAmount
        .mul(0.2)
        .toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);
    }
    const payment = await this.createPaymentRecord(
      order,
      paymentAmount,
      userId,
      paymentMethod,
    );

    const paymentData: PaymentDataDto = {
      paymentMethod,
      orderNumber: Number(order.id),
      paymentNumber: payment.transaction_id,
      email,
      amount: this.convertAmountToCents(totalAmount),
      token: payment.token,
      cart_id: order.cart_id,
    };
    const strategy = this.strategyFactory.getInitiateStrategy(paymentMethod);
    return await strategy.initiatePayment(paymentData);
  }

  private async createPaymentRecord(
    order: Order,
    amount: Prisma.Decimal,
    userId: number,
    paymentMethod: PaymentMethod,
  ): Promise<Payment> {
    return this.prismaService.payment.create({
      data: {
        order: { connect: { id: order.id } },
        user: { connect: { id: userId } },
        amount,
        method: paymentMethod,
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
    const strategy = this.strategyFactory.getResultStrategy(paymentMethod);
    const result = await strategy.processPaymentResult(params);

    const payment = await this.prismaService.payment.findUnique({
      where: { transaction_id: Number(params.ORDERNUMBER) },
    });

    if (!payment) {
      throw new NotFoundException('Платеж не найден');
    }

    await this.prismaService.payment.update({
      where: { id: payment.id },
      data: {
        status: result.isPaymentSuccess
          ? PaymentStatus.PAID
          : PaymentStatus.UNPAID,
        prcode: params.PRCODE,
        srcode: params.SRCODE,
        result_text: params.RESULTTEXT,
      },
    });

    if (result.isPaymentSuccess) {
      await this.updateOrderAfterPayment(payment.order_id, payment.amount);
    }

    return { token: payment.token };
  }

  private async updateOrderAfterPayment(
    orderId: number,
    amountPaid: Prisma.Decimal,
  ) {
    const order = await this.prismaService.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException('Заказ не найден');
    }

    const newTotalPaid = order.total_paid.add(amountPaid);

    let newOrderStatus = order.order_status;
    if (newTotalPaid.lt(order.total_current_price)) {
      newOrderStatus = OrderStatus.PARTIALLY_PAID;
    } else if (newTotalPaid.gte(order.total_current_price)) {
      newOrderStatus = OrderStatus.CONFIRMED;
    }

    await this.prismaService.order.update({
      where: { id: orderId },
      data: {
        total_paid: newTotalPaid,
        order_status: newOrderStatus,
        paid_at: new Date(),
      },
    });

    if (order.cart_id) {
      await this.prismaService.cart.update({
        where: { id: order.cart_id },
        data: { status: CartStatus.ORDERED },
      });
    }
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
