import { IsNumber, IsOptional, IsString } from 'class-validator';

export class PaymentDataDto {
  @IsNumber()
  orderNumber: number;

  @IsNumber()
  paymentNumber: number;

  @IsNumber()
  amount: number;

  @IsOptional()
  @IsString()
  email?: string;
}
