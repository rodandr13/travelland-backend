import { Type } from 'class-transformer';
import { IsArray, IsNotEmpty, IsString, ValidateNested } from 'class-validator';

import { BookingDTO } from './booking.dto';
import { ParticipantDTO } from './participant.dto';

export class ExcursionDto extends BookingDTO {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ParticipantDTO)
  participants: ParticipantDTO[];

  @IsString()
  title: string;

  @IsString()
  slug: string;

  @IsString()
  image_src: string;

  @IsString()
  image_lqip: string;

  @IsNotEmpty()
  @IsString()
  type: string = 'excursion';
}
