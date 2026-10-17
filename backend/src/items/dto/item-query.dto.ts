import { ApiPropertyOptional } from '@nestjs/swagger';
import { ItemStatus, ItemType } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsEnum, IsIn, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export class ItemQueryDto {
  @ApiPropertyOptional({ example: 'keys' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: ItemType })
  @IsOptional()
  @IsEnum(ItemType)
  type?: ItemType;

  @ApiPropertyOptional({ enum: ItemStatus })
  @IsOptional()
  @IsEnum(ItemStatus)
  status?: ItemStatus;

  @ApiPropertyOptional({ example: 'Keys' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ example: 'Tunis' })
  @IsOptional()
  @IsString()
  governorate?: string;

  @ApiPropertyOptional({ example: 'La Marsa' })
  @IsOptional()
  @IsString()
  delegation?: string;

  @ApiPropertyOptional({ default: 1, minimum: 1, maximum: 10000, type: Number })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(10000)
  page?: number = 1;

  @ApiPropertyOptional({ default: 6, minimum: 1, maximum: 100, type: Number })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 6;

  @ApiPropertyOptional({ enum: ['recent', 'oldest'] })
  @IsOptional()
  @IsString()
  @IsIn(['recent', 'oldest'])
  sort?: 'recent' | 'oldest';
}
