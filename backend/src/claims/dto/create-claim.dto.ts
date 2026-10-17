import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateClaimDto {
  @ApiProperty({ example: 'The keychain has a blue tag' })
    @ApiPropertyOptional({ example: 'Blue' })
  @IsString()
  @IsNotEmpty()
  proofText!: string;

  @IsOptional()
  @IsString()
  answer?: string;
}