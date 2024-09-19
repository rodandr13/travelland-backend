import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class UserDTO {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  telephone: string;

  @IsNotEmpty()
  @IsEmail()
  email: string;
}
