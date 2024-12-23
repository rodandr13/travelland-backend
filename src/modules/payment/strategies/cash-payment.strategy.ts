import { Injectable } from '@nestjs/common';
import { CartStatus, OrderStatus } from '@prisma/client';

import { PaymentInitiateStrategy } from './payment.interface.strategy';
import { PrismaService } from '../../prisma/prisma.service';
import { PaymentDataDto } from '../dto/payment.dto';
import { PaymentInitiateResponse, PaymentResponseParams } from '../types';

@Injectable()
export class CashPaymentStrategy implements PaymentInitiateStrategy {
  constructor(private readonly prismaService: PrismaService) {}

  async initiatePayment(
    paymentData: PaymentDataDto,
  ): Promise<PaymentInitiateResponse> {
    await this.prismaService.order.update({
      where: {
        id: paymentData.orderNumber,
      },
      data: {
        order_status: OrderStatus.CONFIRMED,
      },
    });

    const order = await this.prismaService.order.findUnique({
      where: { id: paymentData.orderNumber },
      select: { cart_id: true },
    });

    if (order?.cart_id) {
      await this.prismaService.cart.update({
        where: { id: order.cart_id },
        data: {
          status: CartStatus.ORDERED,
        },
      });
    }

    return {
      token: paymentData.token,
    };
  }

  async processPaymentResult(params: PaymentResponseParams) {
    console.log(params);
    return { token: 'test' };
  }
}
