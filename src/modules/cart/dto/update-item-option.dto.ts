import { IsNotEmpty, IsString } from 'class-validator';

export class UpdateItemOptionDto {
  @IsString()
  priceType: string;

  @IsNotEmpty()
  quantity: number;

  @IsString()
  categoryTitle?: string;
}
