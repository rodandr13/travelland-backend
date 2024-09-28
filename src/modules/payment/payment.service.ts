import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import * as fs from 'node:fs';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class PaymentService {
  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  async initiatePayment(paymentData: any) {
    const requestData = this.buildPaymentRequest(paymentData);
    const response$ = this.httpService.post(
      this.configService.get('GP_URL_PAY_REQUEST'),
      requestData,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      },
    );

    const response = await lastValueFrom(response$);

    return response.data;
  }

  buildPaymentRequest(paymentData: any): Record<string, string> {
    console.log(paymentData);

    const params: Record<string, string> = {
      MERCHANTNUMBER: process.env.GP_MERCHANT_NUMBER,
      OPERATION: 'CREATE_ORDER',
      ORDERNUMBER: paymentData.orderNumber.toString(),
      AMOUNT: paymentData.amount.toString(),
      CURRENCY: paymentData.currency,
      DEPOSITFLAG: paymentData.depositflag,
      URL: this.configService.get('GP_URL_PAY_RESPONSE'),
      DESCRIPTION: paymentData.description || '',
      EMAIL: paymentData.email || '',
    };

    const baseString = this.createBaseString(params);
    params.DIGEST = this.signData(baseString);

    return params;
  }

  private createBaseString(params: any): string {
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

    const values = signKeys.map((key) => params[key] || '');
    return values.join('|');
  }

  private signData(data: string): string {
    const privateKey = fs.readFileSync(
      this.configService.get('GP_PAYMENT_KEY'),
      'utf8',
    );
    const signer = crypto.createSign('RSA-SHA1');
    signer.update(data);
    return signer.sign(
      {
        key: privateKey,
        passphrase: this.configService.get('GP_PASSPHRASE'),
      },
      'base64',
    );
  }

  private verifyResponse(params: any): boolean {
    const digest = params.DIGEST;
    const baseString = this.createResponseBaseString(params);
    const publicKey = fs.readFileSync('path/to/gpwebpay_public.pem', 'utf8');

    const verifier = crypto.createVerify('sha1');
    verifier.update(baseString);
    return verifier.verify(publicKey, digest, 'base64');
  }

  private createResponseBaseString(params: any): string {
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
      'ADDINFO',
    ];

    const values = signKeys
      .filter((key) => params[key] !== undefined && params[key] !== '')
      .map((key) => params[key]);

    return values.join('|');
  }

  async processPaymentResult(params: any): Promise<void> {
    const isValid = this.verifyResponse(params);

    if (!isValid) {
      throw new Error('Invalid response signature');
    }

    const { PRCODE, SRCODE } = params;

    if (PRCODE === '0' && SRCODE === '0') {
      // Платеж успешен
    } else {
      // Платеж неуспешен
    }
  }

  async handleNotification(params: any): Promise<void> {
    await this.processPaymentResult(params);
  }
}
