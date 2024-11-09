import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CartStatus, OrderStatus, PaymentStatus } from '@prisma/client';

import { PaymentDataDto } from './dto/payment.dto';
import {
  CURRENCY,
  DEPOSIT_FLAG,
  GP_WEB_PAY_FIELD_ORDER,
  PAYMENT_METHOD,
  SIGN_KEYS,
} from './gpwebpay.config';
import {
  GPWebPayOperations,
  PaymentParams,
  PaymentResponseParams,
  PaymentResponseWithoutDigest,
} from './types';
import { GPWebPayUtils } from './utils/gpwebpay.utils';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class GpwebpayService {
  private readonly gpTestUrlPayRequest: string;
  private readonly gpMerchantNumber: string;
  private readonly gpUrlPayResponse: string;
  private readonly gpPassphrase: string;

  constructor(
    private readonly prismaService: PrismaService,
    private readonly configService: ConfigService,
    @Inject('PRIVATE_KEY') private readonly privateKey: string,
    @Inject('PUBLIC_KEY') private readonly publicKey: string,
  ) {
    this.gpTestUrlPayRequest = this.configService.get<string>(
      'GP_TEST_URL_PAY_REQUEST',
    );
    this.gpMerchantNumber =
      this.configService.get<string>('GP_MERCHANT_NUMBER');
    this.gpUrlPayResponse = this.configService.get<string>(
      'GP_URL_PAY_RESPONSE',
    );
    this.gpPassphrase = this.configService.get<string>('GP_PASSPHRASE');
  }

  getPaymentUrl(paymentData: PaymentDataDto): string {
    const paymentParams = this.buildPaymentRequest(paymentData);
    const queryParams = new URLSearchParams(paymentParams).toString();
    return `${this.gpTestUrlPayRequest}?${queryParams}`;
  }

  private buildPaymentRequest(paymentData: PaymentDataDto): PaymentParams {
    const params: Record<string, string> = {
      MERCHANTNUMBER: this.gpMerchantNumber,
      OPERATION: GPWebPayOperations.CREATE_ORDER,
      ORDERNUMBER: paymentData.paymentNumber.toString(),
      AMOUNT: paymentData.amount.toString(),
      CURRENCY: CURRENCY.EUR.toString(),
      DEPOSITFLAG: DEPOSIT_FLAG.OFF,
      URL: this.gpUrlPayResponse,
      EMAIL: paymentData.email || '',
      MERORDERNUM: paymentData.orderNumber.toString(),
      PAYMETHOD: PAYMENT_METHOD.CARD,
    };

    const baseString = GPWebPayUtils.createBaseString(params, SIGN_KEYS);
    params.DIGEST = GPWebPayUtils.signData(
      baseString,
      this.privateKey,
      this.gpPassphrase,
    );

    return params;
  }

  private verifyResponse(params: PaymentResponseParams): boolean {
    const { DIGEST, DIGEST1, ...responseFields } = params;

    if (!DIGEST || !DIGEST1) {
      throw new Error('DIGEST or DIGEST1 is missing in the response');
    }

    // Массив ключей из ответа, исключая DIGEST и DIGEST1
    const signKeys = Object.keys(responseFields);

    // Сортировка ключей в правильном порядке
    const orderedKeys = this.getOrderedResponseKeys(signKeys);

    // Базовая строка для DIGEST
    const baseString = this.createResponseBaseString(
      responseFields,
      orderedKeys,
    );

    // Проверка DIGEST
    const isDigestValid = GPWebPayUtils.verifySignature(
      baseString,
      DIGEST,
      this.publicKey,
    );

    // Базовая строка для DIGEST1 (добавляю MERCHANTNUMBER по доке)
    const baseStringWithMerchant = baseString + '|' + this.gpMerchantNumber;

    // Проверка DIGEST1
    const isDigest1Valid = GPWebPayUtils.verifySignature(
      baseStringWithMerchant,
      DIGEST1,
      this.publicKey,
    );

    return isDigestValid && isDigest1Valid;
  }

  private getOrderedResponseKeys(keys: string[]): string[] {
    return GP_WEB_PAY_FIELD_ORDER.filter((key) => keys.includes(key));
  }

  private createResponseBaseString(
    params: PaymentResponseWithoutDigest,
    orderedKeys: string[],
  ): string {
    const values = orderedKeys.map((key) => params[key] as string);
    return values.join('|');
  }

  async processPaymentResult(params: PaymentResponseParams) {
    const isValid = this.verifyResponse(params);
    if (!isValid) {
      throw new Error('Invalid response signature');
    }

    const { PRCODE, SRCODE, RESULTTEXT, ORDERNUMBER, MERORDERNUM } = params;
    const isPaymentSuccess = PRCODE === '0' && SRCODE === '0';
    const orderId = Number(MERORDERNUM);
    const transactionId = Number(ORDERNUMBER);
    const paymentStatus = isPaymentSuccess
      ? PaymentStatus.PAID
      : PaymentStatus.UNPAID;

    try {
      await this.prismaService.$transaction(async (prisma) => {
        // Обновляем платеж с результатами
        await prisma.payment.update({
          where: { transaction_id: transactionId },
          data: {
            prcode: PRCODE,
            srcode: SRCODE,
            status: paymentStatus,
            result_text: RESULTTEXT,
          },
        });

        // Если платеж успешен, обновляем заказ и корзину
        if (isPaymentSuccess) {
          // Обновляем заказ
          await prisma.order.update({
            where: { id: orderId },
            data: {
              paid_at: new Date(),
              order_status: OrderStatus.CONFIRMED,
            },
          });

          // Получаем cart_id из заказа
          const order = await prisma.order.findUnique({
            where: { id: orderId },
            select: { cart_id: true },
          });
          // Если у заказа есть связанная корзина, обновляем её статус
          if (order?.cart_id) {
            await prisma.cart.update({
              where: { id: order.cart_id },
              data: {
                status: CartStatus.ORDERED,
              },
            });
          }
        }
      });

      const { token } = await this.prismaService.payment.findUnique({
        where: { transaction_id: transactionId },
        select: { token: true },
      });

      return { token };
    } catch (error) {
      throw new Error(`Ошибка обработки платежа: ${error}`);
    }
  }
}
