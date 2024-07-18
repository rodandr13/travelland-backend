import { Body, Controller, Post } from '@nestjs/common';

import { CreateOrderDTO } from './dto/create-order.dto';
import { SanityService } from '../external/sanity/sanity.service';

@Controller('order')
export class OrderController {
  constructor(private readonly sanityService: SanityService) {}

  @Post()
  async create(@Body() createOrderDto: CreateOrderDTO) {
    const { user, reservations } = createOrderDto;
    const query = `*[_type == "excursion"][0]`;
    const excursion = await this.sanityService.fetchData(query);
    return createOrderDto;
  }
}
