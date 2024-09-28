import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import * as fs from 'node:fs';

type PaymentData = {
  orderNumber: number;
  amount: number;
  currency: string;
  depositflag: string;
  description?: string;
  email?: string;
};

type PaymentParams = {
  [key: string]: string;
};

enum GpWebPayOperations {
  CREATE_ORDER = 'CREATE_ORDER',
}

@Injectable()
export class PaymentService {
  private readonly privateKey: string;
  private readonly publicKey: string;

  constructor(private readonly configService: ConfigService) {
    this.privateKey = fs.readFileSync(
      this.configService.get('GP_PAYMENT_KEY'),
      'utf8',
    );

    this.publicKey = fs.readFileSync(
      this.configService.get('GP_PUBLIC_KEY'),
      'utf8',
    );
  }

  buildPaymentRequest(paymentData: PaymentData): PaymentParams {
    const params: Record<string, string> = {
      MERCHANTNUMBER: this.configService.get('GP_MERCHANT_NUMBER'),
      OPERATION: GpWebPayOperations.CREATE_ORDER,
      ORDERNUMBER: paymentData.orderNumber.toString(),
      AMOUNT: paymentData.amount.toString(),
      CURRENCY: paymentData.currency,
      DEPOSITFLAG: paymentData.depositflag,
      URL: this.configService.get('GP_URL_PAY_RESPONSE'),
      DESCRIPTION: paymentData.description || '',
      EMAIL: paymentData.email || '',
    };

    const signKeys = [
      'MERCHANTNUMBER',
      'OPERATION',
      'ORDERNUMBER',
      'AMOUNT',
      'CURRENCY',
      'DEPOSITFLAG',
      'URL',
      'DESCRIPTION',
      'EMAIL',
    ];

    const baseString = this.createBaseString(params, signKeys);
    params.DIGEST = this.signData(baseString);

    return params;
  }

  private createBaseString(params: any, signKeys: string[]): string {
    const values = signKeys
      .filter((key) => params[key] !== undefined && params[key] !== '')
      .map((key) => params[key]);
    return values.join('|');
  }

  private signData(data: string): string {
    const signer = crypto.createSign('RSA-SHA1');
    signer.update(data);
    return signer.sign(
      {
        key: this.privateKey,
        passphrase: this.configService.get('GP_PASSPHRASE'),
      },
      'base64',
    );
  }

  private verifyResponse(params: PaymentParams): boolean {
    const digest = params.DIGEST;
    const baseString = this.createResponseBaseString(params);
    const publicKey = this.publicKey;

    const verifier = crypto.createVerify('RSA-SHA1');
    verifier.update(baseString);
    return verifier.verify(publicKey, digest, 'base64');
  }

  private createResponseBaseString(params: PaymentParams): string {
    const signKeys = [
      'OPERATION',
      'ORDERNUMBER',
      'PRCODE',
      'SRCODE',
      'RESULTTEXT',
    ];

    const values = signKeys
      .filter((key) => params[key] !== undefined && params[key] !== '')
      .map((key) => params[key]);

    return values.join('|');
  }

  async processPaymentResult(params: any): Promise<void> {
    try {
      const isValid = this.verifyResponse(params);
      if (!isValid) {
        throw new Error('Invalid response signature');
      }
    } catch (error) {
      throw error;
    }
  }

  async handleNotification(params: any): Promise<void> {
    await this.processPaymentResult(params);
  }
}
