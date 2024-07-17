import { IsInt, IsNotEmpty, IsString } from 'class-validator';

export class ParticipantDto {
  @IsNotEmpty()
  @IsString()
  category: string;

  @IsNotEmpty()
  @IsInt()
  count: number;
}
