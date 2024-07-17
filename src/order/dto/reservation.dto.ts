import { Type } from 'class-transformer';
import { IsArray, ValidateNested } from 'class-validator';

import { BookingDto } from './booking.dto';
import { ExcursionDto } from './excursion.dto';

export class ReservationDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BookingDto, {
    discriminator: {
      property: '__type',
      subTypes: [
        {
          value: ExcursionDto,
          name: 'excursion',
        },
      ],
    },
    keepDiscriminatorProperty: true,
  })
  reservations: ExcursionDto[];
}
