import { Body, Controller, Post } from '@nestjs/common';

import { CreateOrderDTO } from './dto/create-order.dto';
import { OrderService } from './order.service';
import { SanityService } from '../external/sanity/sanity.service';

@Controller('order')
export class OrderController {
  constructor(
    private readonly sanityService: SanityService,
    private readonly orderService: OrderService,
  ) {}

  @Post()
  async createOrder(@Body() createOrderDto: CreateOrderDTO) {
    return this.orderService.createOrder(createOrderDto);
  }
}
