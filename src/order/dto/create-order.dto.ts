import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsNotEmpty,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';

import { PersonCountDto } from './person-count.dto';

export class CreateOrderDto {
  @IsNotEmpty()
  @IsUUID()
  user_id: string;

  @IsNotEmpty()
  @IsString()
  excursion_id: string;

  @IsNotEmpty()
  @IsDateString()
  selected_date: string;

  @IsNotEmpty()
  @IsString()
  time: string;

  @IsNotEmpty()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PersonCountDto)
  person_count: PersonCountDto[];
}
