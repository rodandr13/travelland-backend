import { Type } from 'class-transformer';
import { IsArray, ValidateNested, IsNotEmpty, IsString } from 'class-validator';

import { BookingDTO } from './booking.dto';
import { ParticipantDTO } from './participant.dto';

export class ExcursionDto extends BookingDTO {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ParticipantDTO)
  participants: ParticipantDTO[];

  @IsString()
  title: string;

  @IsNotEmpty()
  @IsString()
  __type: string = 'excursion';
}
