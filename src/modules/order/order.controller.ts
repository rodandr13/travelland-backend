import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Order, PaymentMethod } from '@prisma/client';

import { CreateOrderDTO } from './dto/create-order.dto';
import { OrderService } from './order.service';
import { CreateOrderResponse } from './responses/create-order.response';
import { CurrentUser } from '../auth/decorators/user.decorator';

@Controller('order')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Get()
  @UseGuards(AuthGuard('jwt'))
  async getAllOrders(@CurrentUser() user): Promise<Order[]> {
    return this.orderService.getUserOrders(user.id);
  }

  @Post()
  async createOrder(
    @Body() createOrderDto: CreateOrderDTO,
  ): Promise<CreateOrderResponse> {
    const result = await this.orderService.createOrder(createOrderDto);

    if (result.method === PaymentMethod.CARD && result.url) {
      return {
        payment_method: PaymentMethod.CARD,
        redirect: result.url,
      };
    } else if (result.method === PaymentMethod.CASH) {
      return {
        payment_method: PaymentMethod.CASH,
        token: result.token,
      };
    }
  }
}
