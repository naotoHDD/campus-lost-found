import { PartialType } from '@nestjs/swagger';
import { ItemStatus } from '@prisma/client';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { CreateItemDto } from './create-item.dto.js';

export class UpdateItemDto extends PartialType(CreateItemDto) {
	@ApiPropertyOptional({ enum: ItemStatus })
	@IsOptional()
	@IsEnum(ItemStatus)
	status?: ItemStatus;
}
