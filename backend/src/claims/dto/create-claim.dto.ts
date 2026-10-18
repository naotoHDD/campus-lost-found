import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateClaimDto {
  @ApiProperty({ example: 'The keychain has a blue tag' })
  @IsString()
  @IsNotEmpty()
  proofText!: string;

  @ApiProperty({ example: 'Blue' })
  @IsString()
  @IsNotEmpty()
  answer!: string;
}
