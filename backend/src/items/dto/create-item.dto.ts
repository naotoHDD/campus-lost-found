import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { ItemType } from '@prisma/client';

export class CreateItemDto {
  @ApiProperty({ example: 'Lost keys' })
  @IsNotEmpty()
  @IsString()
  title!: string;

  @ApiProperty({ example: 'Blue keychain with three keys' })
  @IsNotEmpty()
  @IsString()
  description!: string;

  @ApiProperty({ enum: ItemType })
  @IsEnum(ItemType)
  type!: ItemType;

  @ApiProperty({ example: 'Keys' })
  @IsNotEmpty()
  @IsString()
  category!: string;

  @ApiProperty({ format: 'date-time', example: '2026-10-05T12:00:00.000Z' })
  @IsDateString()
  itemDate!: string;

  @ApiProperty({ example: 'Tunis' })
  @IsNotEmpty()
  @IsString()
  governorate!: string;

  @ApiProperty({ example: 'La Marsa' })
  @IsNotEmpty()
  @IsString()
  delegation!: string;

  @ApiPropertyOptional({ example: 'Gammarth' })
  @IsOptional()
  @IsString()
  locality?: string;

  @ApiPropertyOptional({ example: 'Near the main gate' })
  @IsOptional()
  @IsString()
  addressText?: string;

  @ApiPropertyOptional({ example: 36.9 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  latitude?: number;

  @ApiPropertyOptional({ example: 10.3 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  longitude?: number;

  @ApiProperty({ example: 'Blue rubber tag' })
  @IsNotEmpty()
  @IsString()
  verificationDetails!: string;

  @ApiProperty({ example: 'What is attached to the key ring?' })
  @IsNotEmpty()
  @IsString()
  verificationQuestion!: string;
}
