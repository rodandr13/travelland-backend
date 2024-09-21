import { Type } from 'class-transformer';
import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

import { BookingDTO } from './booking.dto';
import { ExcursionDto } from './excursion.dto';
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

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BookingDTO, {
    discriminator: {
      property: 'type',
      subTypes: [{ value: ExcursionDto, name: 'EXCURSION' }],
    },
    keepDiscriminatorProperty: true,
  })
  orderItems: ExcursionDto[];
}
