import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
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
    const { user, paymentMethod } = createOrderDTO;
    if (!user || !paymentMethod) {
      throw new BadRequestException(
        'Отсутствуют необходимые данные для заказа.',
      );
    }

    const paymentMethodEnum =
      PaymentMethod[paymentMethod.toUpperCase() as keyof typeof PaymentMethod];
    if (!Object.values(PaymentMethod).includes(paymentMethodEnum)) {
      throw new BadRequestException('Неподдерживаемый метод оплаты.');
    }

    const telegramClientId =
      this.configService.get<string>('TELEGRAM_CLIENT_ID');
    if (!telegramClientId) {
      throw new InternalServerErrorException(
        'Не настроен идентификатор клиента Telegram.',
      );
    }

    let existingUser = await this.userService.getByEmailWithoutPassword(
      user.email,
    );

    if (!existingUser) {
      existingUser = await this.userService.create({
        email: user.email,
        firstName: 'Tourist',
        password: 'randomPassword',
      });
      // TODO: Уведомить пользователя о создании аккаунта и предоставить инструкции по установке пароля
    }

    let totalOrderBasePrice = new Prisma.Decimal(0);
    let totalOrderCurrentPrice = new Prisma.Decimal(0);

    const cartOrders = await this.prisma.cart.findFirst({
      where: {
        id: createOrderDTO.cartId,
      },
      include: {
        cart_items: {
          include: {
            cart_item_options: true,
          },
        },
      },
    });

    const orderServicesData = await Promise.all(
      cartOrders.cart_items.map(async (service) => {
        const { basePrices, currentPrices } =
          await this.sanityService.getExcursionPrices(
            service.service_id,
            service.date.toISOString(),
          );

        const servicePriceData = service.cart_item_options.map(
          (participant) => {
            const basePriceValue = basePrices.find(
              (price) => participant.category_id === price.categoryId,
            )?.price;
            const currentPriceValue = currentPrices.find(
              (price) => participant.category_id === price.categoryId,
            )?.price;

            if (
              basePriceValue === undefined ||
              currentPriceValue === undefined
            ) {
              throw new BadRequestException(
                `Цена не найдена для категории ${participant.category_title}`,
              );
            }

            const basePrice = new Prisma.Decimal(basePriceValue);
            const currentPrice = new Prisma.Decimal(currentPriceValue);

            const quantity = participant.quantity;
            const totalBasePrice = basePrice.mul(quantity);
            const totalCurrentPrice = currentPrice.mul(quantity);

            return {
              category_title: participant.category_title,
              price_type: participant.price_type,
              base_price: basePrice,
              current_price: currentPrice,
              quantity: quantity,
              total_base_price: totalBasePrice,
              total_current_price: totalCurrentPrice,
            };
          },
        );

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
          service_id: service.service_id,
          service_title: service.title,
          slug: service.slug,
          image_src: service.image_src,
          image_lqip: service.image_lqip,
          service_type: service.service_type as ServiceType,
          date: service.date,
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
        order_status: OrderStatus.PROCESSING,
        email_status: NotificationStatus.NOT_SENT,
        telegram_status: NotificationStatus.NOT_SENT,
        total_base_price: totalOrderBasePrice,
        total_current_price: totalOrderCurrentPrice,
        discount_amount: totalOrderBasePrice.sub(totalOrderCurrentPrice),
        cart: {
          connect: { id: cartOrders.id },
        },
        order_services: {
          create: orderServicesData,
        },
      },
    });

    // await this.notificationService.sendOrderNotification(
    //   telegramClientId,
    //   createOrderDTO,
    // );

    const payment = await this.paymentService.processPayment(
      order,
      paymentMethodEnum,
      totalOrderCurrentPrice,
      existingUser.email,
      existingUser.id,
    );

    return {
      url: payment.url,
      token: payment.token,
      method: paymentMethodEnum,
    };
  }
}
