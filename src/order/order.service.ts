import { Injectable } from '@nestjs/common';
import { PaymentMethod } from '@prisma/client';

import { CreateOrderDTO } from './dto/create-order.dto';
import { SanityService } from '../external/sanity/sanity.service';
import { PrismaService } from '../prisma/prisma.service';
import { UserService } from '../user/user.service';

@Injectable()
export class OrderService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly userService: UserService,
    private readonly sanityService: SanityService,
  ) {}

  async createOrder(createOrderDTO: CreateOrderDTO) {
    const { user, reservations, promoCode, paymentMethod } = createOrderDTO;

    const prices = await this.sanityService.getExcursionPrices(
      '8871f68c-5594-4e11-a87f-e04df493a732',
      '2024-07-21',
    );

    console.log(prices);
    let existingUser = await this.userService.getByEmail(user.email);

    if (!existingUser) {
      existingUser = await this.userService.create({
        email: user.email,
        password: 'temp_password',
      });
    }

    const paymentMethodEnum =
      PaymentMethod[paymentMethod.toUpperCase() as keyof typeof PaymentMethod];

    return this.prisma.order.create({
      data: {
        user_id: existingUser.id,
        payment_method: paymentMethodEnum,
        promo_code: promoCode?.toUpperCase(),
        order_status: 'PENDING',
        email_status: 'PENDING',
        telegram_status: 'PENDING',
        payment_status: 'PENDING',
        order_reservations: {
          create: reservations.map((reservation) => ({
            reservation_id: reservation.id,
            reservation_type: reservation.__type,
            date: new Date(reservation.date).toISOString(),
            time: reservation.time,
            reservation_prices: {
              create: reservation.participants.map((participant) => ({
                price_type: participant.category,
                base_price: 11,
                current_price: 11,
                amount_persons: participant.count,
              })),
            },
          })),
        },
      },
    });
  }
}
