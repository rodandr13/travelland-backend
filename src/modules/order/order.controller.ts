import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { Order } from '@prisma/client';

import { CreateOrderDTO } from './dto/create-order.dto';
import { OrderService } from './order.service';
import { CurrentUser } from '../auth/decorators/user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt.guards';

@Controller('order')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  async getAllOrders(@CurrentUser() user): Promise<Order[]> {
    return this.orderService.getUserOrders(user.id);
  }

  @Post()
  async createOrder(@Body() createOrderDto: CreateOrderDTO) {
    const result = await this.orderService.createOrder(createOrderDto);
    console.log(result);
    if (result.paymentUrl) {
      return { redirect: result.paymentUrl };
    } else {
      return { message: 'Заказ создан без необходимости оплаты' };
    }
  }
}
