import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export class CreateLocationDto {
  @ApiProperty({ example: 'Tunis' })
    @ApiProperty({ example: 'La Marsa' })
    @ApiPropertyOptional({ example: 'Gammarth' })
    @ApiPropertyOptional({ example: 'Near the main gate' })
    @ApiPropertyOptional({ example: 36.9, minimum: -90, maximum: 90 })
    @ApiPropertyOptional({ example: 10.3, minimum: -180, maximum: 180 })
  @IsString()
  @IsNotEmpty()
  governorate!: string;

  @IsString()
  @IsNotEmpty()
  delegation!: string;

  @IsOptional()
  @IsString()
  locality?: string;

  @IsOptional()
  @IsString()
  addressText?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude?: number;
}