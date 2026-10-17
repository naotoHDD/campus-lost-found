import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Role } from '@prisma/client';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { imageFileFilter, MAX_UPLOAD_SIZE_BYTES, multerStorage, removeStoredUpload, validateStoredUpload } from '../common/utils/upload.util.js';
import { CreateItemDto } from './dto/create-item.dto.js';
import { ItemQueryDto } from './dto/item-query.dto.js';
import { UpdateItemDto } from './dto/update-item.dto.js';
import { ItemsService } from './items.service.js';

@Controller('items')
@ApiTags('Items')
export class ItemsController {
  constructor(private readonly itemsService: ItemsService) {}

  @Get()
  @ApiOperation({ summary: 'Search and paginate public items' })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'type', required: false, enum: ['LOST', 'FOUND'] })
  @ApiQuery({ name: 'status', required: false, enum: ['ACTIVE', 'CLAIMED', 'RETURNED', 'CLOSED'] })
  @ApiQuery({ name: 'category', required: false, type: String })
  @ApiQuery({ name: 'governorate', required: false, type: String })
  @ApiQuery({ name: 'delegation', required: false, type: String })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 6 })
  @ApiQuery({ name: 'sort', required: false, enum: ['recent', 'oldest'] })
  list(@Query() query: ItemQueryDto) {
    return this.itemsService.list(query);
  }

  @Get('mine')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List the authenticated user items with precise locations' })
  listMine(@CurrentUser() user: { id: number }, @Query() query: ItemQueryDto) {
    return this.itemsService.list(query, { ownerId: user.id, includePreciseLocation: true });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a public item detail with coarse location information' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.itemsService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create an item post' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['title', 'description', 'type', 'category', 'itemDate', 'governorate', 'delegation'],
      properties: {
        title: { type: 'string' },
        description: { type: 'string' },
        type: { type: 'string', enum: ['LOST', 'FOUND'] },
        category: { type: 'string' },
        itemDate: { type: 'string', format: 'date-time' },
        governorate: { type: 'string' },
        delegation: { type: 'string' },
        locality: { type: 'string' },
        addressText: { type: 'string' },
        latitude: { type: 'number' },
        longitude: { type: 'number' },
        verificationDetails: { type: 'string' },
        verificationQuestion: { type: 'string' },
        image: { type: 'string', format: 'binary' },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('image', {
      storage: multerStorage,
      limits: { fileSize: MAX_UPLOAD_SIZE_BYTES },
      fileFilter: imageFileFilter,
    }),
  )
  async create(
    @CurrentUser() user: { id: number },
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: CreateItemDto,
  ) {
    try {
      const imageFileName = file
        ? await validateStoredUpload(file, ['image/jpeg', 'image/png'])
        : undefined;
      return await this.itemsService.create(dto, user.id, imageFileName);
    } catch (error) {
      await removeStoredUpload(file);
      throw error;
    }
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update an owned item; admins may update any item' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('image', {
      storage: multerStorage,
      limits: { fileSize: MAX_UPLOAD_SIZE_BYTES },
      fileFilter: imageFileFilter,
    }),
  )
  async update(
    @CurrentUser() user: { id: number; role: string },
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: UpdateItemDto,
  ) {
    try {
      const imageFileName = file
        ? await validateStoredUpload(file, ['image/jpeg', 'image/png'])
        : undefined;
      return await this.itemsService.update(id, user.id, dto, imageFileName, user.role === Role.ADMIN);
    } catch (error) {
      await removeStoredUpload(file);
      throw error;
    }
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete an owned item; admins may delete any item' })
  remove(@CurrentUser() user: { id: number; role: string }, @Param('id', ParseIntPipe) id: number) {
    return this.itemsService.remove(id, user.id, user.role === Role.ADMIN);
  }
}
