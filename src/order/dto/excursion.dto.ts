import { Type } from 'class-transformer';
import { IsArray, IsNotEmpty, ValidateNested } from 'class-validator';

import { BookingDto } from './booking.dto';
import { ParticipantDto } from './participant.dto';

export class ExcursionDto extends BookingDto {
  @IsNotEmpty()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ParticipantDto)
  participant: ParticipantDto[];
}
