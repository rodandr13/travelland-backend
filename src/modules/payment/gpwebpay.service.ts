import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PaymentStatus } from '@prisma/client';

import {
  CURRENCY,
  DEPOSIT_FLAG,
  GP_WEB_PAY_FIELD_ORDER,
  PAYMENT_METHOD,
  SIGN_KEYS,
} from './gpwebpay.config';
import { PaymentDataDto } from './dto/payment.dto';
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
    const { PRCODE, SRCODE, RESULTTEXT } = params;
    const isPaymentSuccess = PRCODE === '0' && SRCODE === '0';
    const { token } = await this.updateReturnPayment(
      Number(params.ORDERNUMBER),
      PRCODE,
      SRCODE,
      isPaymentSuccess ? PaymentStatus.PAID : PaymentStatus.UNPAID,
      RESULTTEXT,
    );
    console.log(token);
    return {
      token,
    };
  }

  private async updateReturnPayment(
    transaction_id: number,
    prcode: string,
    srcode: string,
    status: PaymentStatus,
    result_text: string,
  ) {
    return this.prismaService.payment.update({
      where: {
        transaction_id,
      },
      data: {
        prcode,
        srcode,
        status,
        result_text,
      },
      select: {
        token: true,
      },
    });
  }
}