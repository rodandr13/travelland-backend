import { IsNumber, IsString } from 'class-validator';

export class ItemOptionDto {
  @IsString()
  priceType: string;

  @IsNumber()
  quantity: number;
}
