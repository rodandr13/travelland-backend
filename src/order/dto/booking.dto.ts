import { IsDateString, IsNotEmpty, IsString } from 'class-validator';

export class BookingDto {
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
