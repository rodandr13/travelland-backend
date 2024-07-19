import { Injectable } from '@nestjs/common';
import { PaymentMethod } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

import { CreateOrderDTO } from './dto/create-order.dto';
import { PrismaService } from '../prisma/prisma.service';
import { UserService } from '../user/user.service';

@Injectable()
export class OrderService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly userService: UserService,
  ) {}

  async createOrder(createOrderDTO: CreateOrderDTO) {
    const { user, reservations, promoCode, paymentMethod } = createOrderDTO;

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
        id: uuidv4(),
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
                base_price: participant.basePrice,
                current_price: participant.currentPrice,
                amount_persons: participant.count,
              })),
            },
          })),
        },
      },
    });
  }
}
