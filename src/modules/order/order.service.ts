import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  NotificationStatus,
  Order,
  OrderStatus,
  PaymentMethod,
  Prisma,
  ServiceType,
} from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

import { CreateOrderDTO } from './dto/create-order.dto';
import { SanityService } from '../external/sanity/sanity.service';
import { NotificationService } from '../notification/notification.service';
import { PaymentDataDto } from '../payment/payment.dto';
import { PaymentService } from '../payment/payment.service';
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
    private readonly paymentService: PaymentService,
  ) {}

  async getUserOrders(userId: number): Promise<Order[]> {
    return this.prisma.order.findMany({
      where: {
        user_id: userId,
      },
      include: {
        order_services: {
          include: {
            service_prices: true,
          },
        },
      },
    });
  }

  async createOrder(createOrderDTO: CreateOrderDTO) {
    const { user, orderServices, paymentMethod } = createOrderDTO;

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

    const orderServicesData = await Promise.all(
      orderServices.map(async (service) => {
        const { basePrices, currentPrices } =
          await this.sanityService.getExcursionPrices(service.id, service.date);

        const servicePriceData = service.participants.map((participant) => {
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

        const totalServiceBasePrice = servicePriceData.reduce(
          (sum, price) => sum.add(price.total_base_price),
          new Prisma.Decimal(0),
        );
        const totalServiceCurrentPrice = servicePriceData.reduce(
          (sum, price) => sum.add(price.total_current_price),
          new Prisma.Decimal(0),
        );

        totalOrderBasePrice = totalOrderBasePrice.add(totalServiceBasePrice);
        totalOrderCurrentPrice = totalOrderCurrentPrice.add(
          totalServiceCurrentPrice,
        );

        return {
          service_id: service.id,
          service_title: service.title,
          slug: service.slug,
          image_src: service.image_src,
          image_lqip: service.image_lqip,
          service_type: service.type as ServiceType,
          date: new Date(service.date),
          time: service.time,
          total_base_price: totalServiceBasePrice,
          total_current_price: totalServiceCurrentPrice,
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
        total_base_price: totalOrderBasePrice,
        total_current_price: totalOrderCurrentPrice,
        discount_amount: totalOrderBasePrice.sub(totalOrderCurrentPrice),
        order_services: {
          create: orderServicesData,
        },
      },
    });

    if (paymentMethodEnum === PaymentMethod.CARD) {
      const amountInCentsDecimal = totalOrderCurrentPrice.mul(100);
      const amountInCents = amountInCentsDecimal
        .toDecimalPlaces(0, Prisma.Decimal.ROUND_HALF_UP)
        .toNumber();

      const paymentData: PaymentDataDto = {
        paymentMethod: PaymentMethod.CARD,
        orderNumber: Number(order.id),
        paymentNumber: Number(order.id),
        email: existingUser.email,
        amount: amountInCents,
      };

      const paymentUrl = await this.paymentService.initiatePayment(paymentData);

      await this.notificationService.sendOrderNotification(
        this.configService.get<string>('TELEGRAM_CLIENT_ID'),
        createOrderDTO,
      );

      return { paymentUrl };
    } else if (paymentMethodEnum === PaymentMethod.CASH) {
      await this.notificationService.sendOrderNotification(
        this.configService.get<string>('TELEGRAM_CLIENT_ID'),
        createOrderDTO,
      );

      return { message: 'Заказ создан. Ожидается оплата наличными.' };
    } else {
      throw new BadRequestException('Неподдерживаемый метод оплаты.');
    }
  }
}
