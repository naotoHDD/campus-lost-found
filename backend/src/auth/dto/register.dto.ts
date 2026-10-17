import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, MinLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'Amina Ben Ali' })
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'amina@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ minLength: 6, writeOnly: true })
  @IsNotEmpty()
  @MinLength(6)
  password: string;
}
