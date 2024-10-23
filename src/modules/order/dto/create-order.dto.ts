import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

import { UserDTO } from './user.dto';

export class CreateOrderDTO {
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => UserDTO)
  user: UserDTO;

  @IsString()
  @IsOptional()
  promoCode?: string;

  @IsNotEmpty()
  @IsString()
  paymentMethod: string;
}
