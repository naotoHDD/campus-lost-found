import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class CreateLocationDto {
  @ApiProperty({ example: 'Tunis' })
  @IsString()
  @IsNotEmpty()
  governorate!: string;

  @ApiProperty({ example: 'La Marsa' })
  @IsString()
  @IsNotEmpty()
  delegation!: string;

  @ApiPropertyOptional({ example: 'Gammarth' })
  @IsOptional()
  @IsString()
  locality?: string;

  @ApiPropertyOptional({ example: 'Near the main gate' })
  @IsOptional()
  @IsString()
  addressText?: string;

  @ApiPropertyOptional({ example: 36.9, minimum: -90, maximum: 90 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude?: number;

  @ApiPropertyOptional({ example: 10.3, minimum: -180, maximum: 180 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude?: number;
}
