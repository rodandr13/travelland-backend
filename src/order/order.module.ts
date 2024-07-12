import { Module } from '@nestjs/common';

import { OrderController } from './order.controller';
import { OrderService } from './order.service';
import { SanityService } from '../external/sanity/sanity.service';

@Module({
  providers: [OrderService, SanityService],
  controllers: [OrderController],
})
export class OrderModule {}
