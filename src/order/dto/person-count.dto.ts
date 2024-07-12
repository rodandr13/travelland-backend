import { IsInt, IsNotEmpty, IsString, Min } from 'class-validator';

export class PersonCountDto {
  @IsNotEmpty()
  @IsString()
  type: string;

  @IsNotEmpty()
  @IsInt()
  @Min(0)
  count: number;
}
