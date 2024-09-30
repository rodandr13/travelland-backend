import { IsNumber, IsString, IsOptional } from 'class-validator';

export class PaymentDataDto {
  @IsNumber()
  orderNumber: number;

  @IsNumber()
  amount: number;

  @IsNumber()
  currency: number;

  @IsNumber()
  depositflag: number;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  email?: string;
}
