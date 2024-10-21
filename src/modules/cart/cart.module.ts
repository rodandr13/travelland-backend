import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';

import { CartController } from './cart.controller';
import { CartService } from './cart.service';
import { GuestSessionMiddleware } from './middleware/guest-session.middleware';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  providers: [CartService],
  controllers: [CartController],
})
export class CartModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(GuestSessionMiddleware).forRoutes(CartController);
  }
}
