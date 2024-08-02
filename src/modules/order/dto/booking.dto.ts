import { IsDateString, IsNotEmpty, IsString } from 'class-validator';

import { IsActualDate } from '../../../common/validators/is-actual-date.validator';

export abstract class BookingDTO {
  @IsNotEmpty()
  @IsString()
  id: string;

  @IsNotEmpty()
  @IsDateString()
  @IsActualDate()
  date: string;

  @IsNotEmpty()
  @IsString()
  time: string;
}
