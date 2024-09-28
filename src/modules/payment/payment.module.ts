import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';

import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';

@Module({
  imports: [HttpModule],
  providers: [PaymentService],
  controllers: [PaymentController],
})
export class PaymentModule {}
