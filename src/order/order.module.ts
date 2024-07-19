import { Module } from '@nestjs/common';

import { OrderController } from './order.controller';
import { OrderService } from './order.service';
import { SanityService } from '../external/sanity/sanity.service';
import { UserService } from '../user/user.service';

@Module({
  providers: [OrderService, SanityService, UserService],
  controllers: [OrderController],
})
export class OrderModule {}
