import { IsDateString, IsNotEmpty, IsString } from 'class-validator';

export abstract class BookingDTO {
  @IsNotEmpty()
  @IsString()
  id: string;

  @IsNotEmpty()
  @IsDateString()
  date: string;

  @IsNotEmpty()
  @IsString()
  time: string;
}
