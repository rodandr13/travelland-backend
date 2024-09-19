import { Injectable } from '@nestjs/common';
import { Order, PaymentMethod } from '@prisma/client';

import { CreateOrderDTO } from './dto/create-order.dto';
import { SanityService } from '../external/sanity/sanity.service';
import { NotificationService } from '../notification/notification.service';
import { PrismaService } from '../prisma/prisma.service';
import { UserService } from '../user/user.service';

@Injectable()
export class OrderService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly userService: UserService,
    private readonly sanityService: SanityService,
    private readonly notificationService: NotificationService,
  ) {}

  async getUserOrders(userId: number): Promise<Order[]> {
    const orders = await this.prisma.order.findMany({
      where: {
        user_id: userId,
      },
      include: {
        order_reservations: {
          include: {
            reservation_prices: true,
          },
        },
      },
    });

    return orders.map((order) => {
      const reservationsWithTotals = order.order_reservations.map(
        (reservation) => {
          const reservationTotalCurrentPrice =
            reservation.reservation_prices.reduce((sum, price) => {
              return sum + price.current_price * price.amount_persons;
            }, 0);

          const reservationTotalBasePrice =
            reservation.reservation_prices.reduce((sum, price) => {
              return sum + price.base_price * price.amount_persons;
            }, 0);

          return {
            ...reservation,
            reservationTotalCurrentPrice,
            reservationTotalBasePrice,
          };
        },
      );

      const orderTotalCurrentPrice = reservationsWithTotals.reduce(
        (sum, reservation) => {
          return sum + reservation.reservationTotalCurrentPrice;
        },
        0,
      );

      const orderTotalBasePrice = reservationsWithTotals.reduce(
        (sum, reservation) => {
          return sum + reservation.reservationTotalBasePrice;
        },
        0,
      );

      return {
        ...order,
        orderTotalCurrentPrice,
        orderTotalBasePrice,
        order_reservations: reservationsWithTotals,
      };
    });
  }

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

    const order = await this.prisma.order.create({
      data: {
        user_id: existingUser.id,
        payment_method: paymentMethodEnum,
        promo_code: promoCode?.toUpperCase(),
        order_status: 'PENDING',
        email_status: 'PENDING',
        telegram_status: 'PENDING',
        payment_status: 'PENDING',
        order_reservations: {
          create: await Promise.all(
            reservations.map(async (reservation) => {
              const { basePrices, currentPrices } =
                await this.sanityService.getExcursionPrices(
                  reservation.id,
                  reservation.date,
                );
              return {
                reservation_id: reservation.id,
                reservation_title: reservation.title,
                slug: reservation.slug,
                image_src: reservation.image_src,
                image_lqip: reservation.image_lqip,
                reservation_type: reservation.type,
                date: new Date(reservation.date).toISOString(),
                time: reservation.time,
                reservation_prices: {
                  create: reservation.participants.map((participant) => ({
                    category_title: participant.title,
                    price_type: participant.category,
                    base_price: basePrices.find(
                      (price) => participant.category === price.categoryId,
                    ).price,
                    current_price: currentPrices.find(
                      (price) => participant.category === price.categoryId,
                    ).price,
                    amount_persons: participant.count,
                  })),
                },
              };
            }),
          ),
        },
      },
    });

    await this.notificationService.sendOrderNotification(
      '318657667',
      createOrderDTO,
    );
    return order;
  }
}
