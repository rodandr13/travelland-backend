import { Body, Controller, Post } from '@nestjs/common';

import { CreateOrderDTO } from './dto/create-order.dto';
import { OrderService } from './order.service';

@Controller('order')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post()
  async createOrder(@Body() createOrderDto: CreateOrderDTO) {
    return this.orderService.createOrder(createOrderDto);
  }
}
