import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export class UpdateLocationDto {
  @ApiPropertyOptional({ example: 'Tunis' })
    @ApiPropertyOptional({ example: 'La Marsa' })
    @ApiPropertyOptional({ example: 'Gammarth' })
    @ApiPropertyOptional({ example: 'Near the main gate' })
    @ApiPropertyOptional({ example: 36.9, minimum: -90, maximum: 90 })
    @ApiPropertyOptional({ example: 10.3, minimum: -180, maximum: 180 })
  @IsOptional()
  @IsString()
  governorate?: string;

  @IsOptional()
  @IsString()
  delegation?: string;

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