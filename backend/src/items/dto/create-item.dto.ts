import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateString, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { ItemType } from '@prisma/client';

export class CreateItemDto {
  @ApiProperty({ example: 'Lost keys' })
  @IsNotEmpty()
    @ApiProperty({ example: 'Blue keychain with three keys' })
    @ApiProperty({ enum: ItemType })
    @ApiProperty({ example: 'Keys' })
    @ApiProperty({ format: 'date-time', example: '2026-10-05T12:00:00.000Z' })
    @ApiProperty({ example: 'Tunis' })
    @ApiProperty({ example: 'La Marsa' })
    @ApiPropertyOptional({ example: 'Gammarth' })
    @ApiPropertyOptional({ example: 'Near the main gate' })
    @ApiPropertyOptional({ example: 36.9 })
    @ApiPropertyOptional({ example: 10.3 })
    @ApiPropertyOptional({ example: 'Blue rubber tag' })
    @ApiPropertyOptional({ example: 'What is attached to the key ring?' })
  @IsString()
  title: string;

  @IsNotEmpty()
  @IsString()
  description: string;

  @IsEnum(ItemType)
  type: ItemType;

  @IsNotEmpty()
  @IsString()
  category: string;

  @IsDateString()
  itemDate: string;

  @IsNotEmpty()
  @IsString()
  governorate: string;

  @IsNotEmpty()
  @IsString()
  delegation: string;

  @IsOptional()
  @IsString()
  locality?: string;

  @IsOptional()
  @IsString()
  addressText?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  longitude?: number;

  @IsOptional()
  @IsString()
  verificationDetails?: string;

  @IsOptional()
  @IsString()
  verificationQuestion?: string;
}
