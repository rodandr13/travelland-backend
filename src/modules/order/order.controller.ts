import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Order } from '@prisma/client';
import { Request } from 'express';

import { CreateOrderDTO } from './dto/create-order.dto';
import { OrderService } from './order.service';
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
    @Req() req: Request,
  ) {
    console.log(req.cookies);
    const result = await this.orderService.createOrder(createOrderDto);
    if (result.paymentUrl) {
      return {
        success: true,
        message: 'Payment successful',
        redirect: result.paymentUrl,
      };
    } else {
      return { message: 'Заказ создан без необходимости оплаты' };
    }
  }
}
