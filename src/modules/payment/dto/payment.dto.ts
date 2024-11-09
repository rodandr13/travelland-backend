import { PaymentMethod } from '@prisma/client';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class PaymentDataDto {
  @IsNumber()
  orderNumber: number;

  @IsNumber()
  paymentNumber: number;

  @IsNumber()
  amount: number;

  @IsString()
  paymentMethod: PaymentMethod;

  @IsOptional()
  @IsString()
  email?: string;

  @IsString()
  token: string;

  @IsNumber()
  cart_id: number;
}

export class PaymentTokenDto {
  @IsString()
  token: string;
}
