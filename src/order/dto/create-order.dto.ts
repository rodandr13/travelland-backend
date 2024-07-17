import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

import { ReservationDto } from './reservation.dto';
import { UserDto } from './user.dto';

export class CreateOrderDto {
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => UserDto)
  user: UserDto;

  @IsString()
  @IsOptional()
  promoCode?: string;

  @IsNotEmpty()
  @IsString()
  paymentMethod: string;

  @IsNotEmpty()
  @ValidateNested()
  @Type(() => ReservationDto)
  reservations: ReservationDto[];
}
