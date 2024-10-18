import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
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
import { parseISO } from 'date-fns';
import { performance } from 'perf_hooks';
import { v4 as uuidv4 } from 'uuid';

import { CreateOrderDTO } from './dto/create-order.dto';
import { SanityService } from '../external/sanity/sanity.service';
import { NotificationService } from '../notification/notification.service';
import { PaymentDataDto } from '../payment/dto/payment.dto';
import { PaymentService } from '../payment/payment.service';
import { PrismaService } from '../prisma/prisma.service';
import { UserService } from '../user/user.service';

@Injectable()
export class OrderService {
  private readonly logger = new Logger(OrderService.name);

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

  private async createPayment(
    order: Order,
    paymentMethod: PaymentMethod,
    totalOrderCurrentPrice: Prisma.Decimal,
    email: string,
  ) {
    const paymentStartTime = performance.now();

    if (paymentMethod === PaymentMethod.CARD) {
      const amountInCentsDecimal = totalOrderCurrentPrice.mul(100);
      const amountInCents = amountInCentsDecimal
        .toDecimalPlaces(0, Prisma.Decimal.ROUND_HALF_UP)
        .toNumber();

      const payment = await this.prisma.payment.create({
        data: {
          order: {
            connect: { id: order.id },
          },
          amount: totalOrderCurrentPrice,
          status: PaymentStatus.UNPAID,
        },
      });

      const paymentData: PaymentDataDto = {
        paymentMethod: PaymentMethod.CARD,
        orderNumber: Number(order.id),
        paymentNumber: payment.transaction_id,
        email: email,
        amount: amountInCents,
      };

      const paymentUrl = await this.paymentService.initiatePayment(paymentData);

      const paymentEndTime = performance.now();
      this.logger.log(
        `Время выполнения createPayment (CARD): ${paymentEndTime - paymentStartTime} ms`,
      );

      return { paymentUrl };
    } else if (paymentMethod === PaymentMethod.CASH) {
      const paymentEndTime = performance.now();
      this.logger.log(
        `Время выполнения createPayment (CASH): ${paymentEndTime - paymentStartTime} ms`,
      );

      return { message: 'Заказ создан. Ожидается оплата наличными.' };
    } else {
      throw new BadRequestException('Неподдерживаемый метод оплаты.');
    }
  }

  async createOrder(createOrderDTO: CreateOrderDTO) {
    const totalStartTime = performance.now();
    const { user, orderServices, paymentMethod } = createOrderDTO;

    if (!user || !orderServices || !paymentMethod) {
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

    const userStartTime = performance.now();
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
    const userEndTime = performance.now();
    this.logger.log(
      `Время получения/создания пользователя: ${userEndTime - userStartTime} ms`,
    );

    let totalOrderBasePrice = new Prisma.Decimal(0);
    let totalOrderCurrentPrice = new Prisma.Decimal(0);

    const servicesStartTime = performance.now();
    const orderServicesData = await Promise.all(
      orderServices.map(async (service) => {
        const pricesStartTime = performance.now();
        const { basePrices, currentPrices } =
          await this.sanityService.getExcursionPrices(service.id, service.date);
        const pricesEndTime = performance.now();
        this.logger.log(
          `Время вызова getExcursionPrices для услуги ${service.id}: ${
            pricesEndTime - pricesStartTime
          } ms`,
        );

        const servicePriceData = service.participants.map((participant) => {
          const basePriceValue = basePrices.find(
            (price) => participant.category === price.categoryId,
          )?.price;
          const currentPriceValue = currentPrices.find(
            (price) => participant.category === price.categoryId,
          )?.price;

          if (basePriceValue === undefined || currentPriceValue === undefined) {
            throw new BadRequestException(
              `Цена не найдена для категории ${participant.category}`,
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
          date: parseISO(service.date),
          time: service.time,
          total_base_price: totalServiceBasePrice,
          total_current_price: totalServiceCurrentPrice,
          service_prices: {
            create: servicePriceData,
          },
        };
      }),
    );
    const servicesEndTime = performance.now();
    this.logger.log(
      `Время обработки orderServicesData: ${
        servicesEndTime - servicesStartTime
      } ms`,
    );

    const transactionStartTime = performance.now();
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
        order_services: {
          create: orderServicesData,
        },
      },
    });
    const transactionEndTime = performance.now();
    this.logger.log(
      `Время выполнения транзакции: ${
        transactionEndTime - transactionStartTime
      } ms`,
    );

    this.logger.log(`Order created with ID: ${order.id}`);

    const notificationStartTime = performance.now();

    this.notificationService
      .sendOrderNotification(telegramClientId, createOrderDTO)
      .then(() => {
        const notificationEndTime = performance.now();
        this.logger.log(
          `Время отправки уведомления: ${
            notificationEndTime - notificationStartTime
          } ms`,
        );
      })
      .catch((error) => {
        const notificationEndTime = performance.now();
        this.logger.error('Не удалось отправить уведомление о заказе', error);
        this.logger.log(
          `Время отправки уведомления (с ошибкой): ${
            notificationEndTime - notificationStartTime
          } ms`,
        );
      });

    const paymentStartTime = performance.now();
    const paymentResult = await this.createPayment(
      order,
      paymentMethodEnum,
      totalOrderCurrentPrice,
      existingUser.email,
    );
    const paymentEndTime = performance.now();
    this.logger.log(
      `Время создания платежа: ${paymentEndTime - paymentStartTime} ms`,
    );

    const totalEndTime = performance.now();
    this.logger.log(
      `Общее время выполнения createOrder: ${totalEndTime - totalStartTime} ms`,
    );

    return paymentResult;
  }
}
