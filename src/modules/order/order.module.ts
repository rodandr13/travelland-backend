import { Module } from '@nestjs/common';

import { OrderController } from './order.controller';
import { OrderService } from './order.service';
import { SanityService } from '../external/sanity/sanity.service';
import { NotificationModule } from '../notification/notification.module';
import { PaymentModule } from '../payment/payment.module';
import { UserService } from '../user/user.service';

@Module({
  imports: [NotificationModule, PaymentModule],
  providers: [OrderService, SanityService, UserService],
  controllers: [OrderController],
})
export class OrderModule {}
