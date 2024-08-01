import { IsInt, IsNotEmpty, IsString } from 'class-validator';

export class ParticipantDTO {
  @IsNotEmpty()
  @IsString()
  category: string;

  @IsString()
  title: string;

  @IsNotEmpty()
  @IsInt()
  count: number;
}
