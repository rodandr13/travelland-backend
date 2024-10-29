import { IsNumber, IsString, Min } from 'class-validator';

export class ItemOptionDto {
  @IsString()
  price_type: string;

  @IsNumber()
  @Min(0)
  base_price: number;

  @IsNumber()
  @Min(0)
  current_price: number;

  @IsNumber()
  @Min(0)
  quantity: number;

  @IsString()
  category_title: string;

  @IsString()
  category_description: string;
}
