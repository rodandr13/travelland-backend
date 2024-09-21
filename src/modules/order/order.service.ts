import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  NotificationStatus,
  Order,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  Prisma,
  ServiceType,
} from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

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
    private readonly configService: ConfigService,
  ) {}

  async getUserOrders(userId: number): Promise<Order[]> {
    const orders = await this.prisma.order.findMany({
      where: {
        user_id: userId,
      },
      include: {
        order_items: {
          include: {
            service_prices: true,
          },
        },
      },
    });

    return orders.map((order) => {
      const orderItemsWithTotals = order.order_items.map((item) => {
        const itemTotalCurrentPrice = item.service_prices.reduce(
          (sum, price) => {
            return sum + price.current_price.toNumber() * price.quantity;
          },
          0,
        );

        const itemTotalBasePrice = item.service_prices.reduce((sum, price) => {
          return sum + price.base_price.toNumber() * price.quantity;
        }, 0);

        return {
          ...item,
          itemTotalCurrentPrice,
          itemTotalBasePrice,
        };
      });

      const orderTotalCurrentPrice = orderItemsWithTotals.reduce(
        (sum, item) => {
          return sum + item.itemTotalCurrentPrice;
        },
        0,
      );

      const orderTotalBasePrice = orderItemsWithTotals.reduce((sum, item) => {
        return sum + item.itemTotalBasePrice;
      }, 0);

      return {
        ...order,
        orderTotalCurrentPrice,
        orderTotalBasePrice,
        order_items: orderItemsWithTotals,
      };
    });
  }

  async createOrder(createOrderDTO: CreateOrderDTO) {
    const { user, orderItems, paymentMethod } = createOrderDTO;

    let existingUser = await this.userService.getByEmail(user.email);

    if (!existingUser) {
      existingUser = await this.userService.create({
        email: user.email,
        firstName: 'Tourist',
        password: 'temp_password_hash',
      });
    }

    const paymentMethodEnum =
      PaymentMethod[paymentMethod.toUpperCase() as keyof typeof PaymentMethod];

    let totalOrderBasePrice = new Prisma.Decimal(0);
    let totalOrderCurrentPrice = new Prisma.Decimal(0);

    const orderItemsData = await Promise.all(
      orderItems.map(async (item) => {
        const { basePrices, currentPrices } =
          await this.sanityService.getExcursionPrices(item.id, item.date);

        const servicePriceData = item.participants.map((participant) => {
          const basePriceValue = basePrices.find(
            (price) => participant.category === price.categoryId,
          )?.price;
          const currentPriceValue = currentPrices.find(
            (price) => participant.category === price.categoryId,
          )?.price;

          if (basePriceValue === undefined || currentPriceValue === undefined) {
            throw new Error(
              `Price not found for category ${participant.category}`,
            );
          }

          const basePrice = new Prisma.Decimal(basePriceValue);
          const currentPrice = new Prisma.Decimal(currentPriceValue);

          const quantity = participant.count;
          const totalBasePrice = basePrice.mul(quantity);
          const totalCurrentPrice = currentPrice.mul(quantity);

          return {
            category_title: participant.title,
            price_type: participant.category,
            base_price: basePrice,
            current_price: currentPrice,
            quantity: quantity,
            total_base_price: totalBasePrice,
            total_current_price: totalCurrentPrice,
          };
        });

        const totalItemBasePrice = servicePriceData.reduce(
          (sum, price) => sum.add(price.total_base_price),
          new Prisma.Decimal(0),
        );
        const totalItemCurrentPrice = servicePriceData.reduce(
          (sum, price) => sum.add(price.total_current_price),
          new Prisma.Decimal(0),
        );

        totalOrderBasePrice = totalItemBasePrice.add(totalItemBasePrice);
        totalOrderCurrentPrice = totalItemBasePrice.add(totalItemCurrentPrice);

        return {
          service_id: item.id,
          service_title: item.title,
          slug: item.slug,
          image_src: item.image_src,
          image_lqip: item.image_lqip,
          service_type: item.type as ServiceType,
          date: new Date(item.date),
          time: item.time,
          total_base_price: totalItemBasePrice,
          total_current_price: totalItemCurrentPrice,
          service_prices: {
            create: servicePriceData,
          },
        };
      }),
    );

    const order = await this.prisma.order.create({
      data: {
        user: {
          connect: { id: existingUser.id },
        },
        order_number: uuidv4(),
        payment_method: paymentMethodEnum,
        order_status: OrderStatus.PENDING,
        email_status: NotificationStatus.NOT_SENT,
        telegram_status: NotificationStatus.NOT_SENT,
        payment_status: PaymentStatus.UNPAID,
        total_base_price: totalOrderBasePrice,
        total_current_price: totalOrderCurrentPrice,
        discount_amount: totalOrderBasePrice.sub(totalOrderCurrentPrice),
        order_items: {
          create: orderItemsData,
        },
      },
    });

    await this.notificationService.sendOrderNotification(
      this.configService.get<string>('TELEGRAM_CLIENT_ID'),
      createOrderDTO,
    );
    return order;
  }
}
