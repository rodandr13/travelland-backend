import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';

import { CreateOrderDto } from './dto/create-order.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class OrderService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createOrderDto: CreateOrderDto) {
    return this.prisma.order.create({
      data: {
        id: uuidv4(),
        user_id: createOrderDto.user_id,
        excursion_id: createOrderDto.excursion_id,
        selected_date: new Date(createOrderDto.selected_date),
        time: createOrderDto.time,
      },
    });
  }
}
