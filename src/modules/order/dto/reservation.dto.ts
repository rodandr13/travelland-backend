import { Type } from 'class-transformer';
import { IsArray, ValidateNested } from 'class-validator';

import { BookingDTO } from './booking.dto';
import { ExcursionDto } from './excursion.dto';

export class ReservationDTO {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BookingDTO, {
    discriminator: {
      property: 'type',
      subTypes: [{ value: ExcursionDto, name: 'excursion' }],
    },
    keepDiscriminatorProperty: true,
  })
  reservations: ExcursionDto[];
}
