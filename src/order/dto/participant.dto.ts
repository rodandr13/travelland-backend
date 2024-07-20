import { IsInt, IsNotEmpty, IsString } from 'class-validator';

export class ParticipantDTO {
  @IsNotEmpty()
  @IsString()
  category: string;

  @IsNotEmpty()
  @IsInt()
  count: number;
}
