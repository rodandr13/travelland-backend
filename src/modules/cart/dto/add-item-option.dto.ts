import { IsNotEmpty, IsString } from 'class-validator';

export class AddItemOptionDto {
  @IsString()
  priceType: string;

  @IsNotEmpty()
  quantity: number;
}
