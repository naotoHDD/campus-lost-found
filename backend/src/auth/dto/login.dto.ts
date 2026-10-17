import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'amina@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ writeOnly: true })
  @IsNotEmpty()
  password: string;
}
