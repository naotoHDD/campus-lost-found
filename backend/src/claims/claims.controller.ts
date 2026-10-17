import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { claimFileFilter, claimFileStorage, getPrivateUploadDirectory, MAX_UPLOAD_SIZE_BYTES, removeStoredUpload, validateStoredUpload } from '../common/utils/upload.util.js';
import { ClaimsService } from './claims.service.js';
import { CreateClaimDto } from './dto/create-claim.dto.js';

@Controller()
@ApiTags('Claims')
export class ClaimsController {
  constructor(private readonly claimsService: ClaimsService) {}

  @Post('items/:itemId/claims')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Submit a claim for an active item' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['proofText'],
      properties: {
        proofText: { type: 'string' },
        answer: { type: 'string' },
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: claimFileStorage,
      limits: { fileSize: MAX_UPLOAD_SIZE_BYTES },
      fileFilter: claimFileFilter,
    }),
  )
  async create(
    @CurrentUser() user: { id: number },
    @Param('itemId', ParseIntPipe) itemId: number,
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: CreateClaimDto,
  ) {
    try {
      const attachmentFileName = file
        ? await validateStoredUpload(file, ['image/jpeg', 'image/png', 'application/pdf'])
        : undefined;
      return await this.claimsService.create(itemId, user.id, dto, attachmentFileName);
    } catch (error) {
      await removeStoredUpload(file);
      throw error;
    }
  }

  @Get('claims/my')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List claims submitted by the authenticated user' })
  myClaims(@CurrentUser() user: { id: number }) {
    return this.claimsService.myClaims(user.id);
  }

  @Get('claims/:claimId/attachment')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Download a private claim attachment as a participant or admin' })
  async attachment(
    @CurrentUser() user: { id: number; role: string },
    @Param('claimId', ParseIntPipe) claimId: number,
    @Res() response: Response,
  ) {
    const fileName = await this.claimsService.getAttachment(claimId, user.id, user.role);
    response.sendFile(fileName, { root: getPrivateUploadDirectory() });
  }

  @Patch('claims/:claimId/accept')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Accept a pending claim for an active item as its owner or an admin' })
  accept(
    @CurrentUser() user: { id: number; role: string },
    @Param('claimId', ParseIntPipe) claimId: number,
  ) {
    return this.claimsService.accept(claimId, user.id, user.role);
  }

  @Patch('claims/:claimId/reject')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Reject a pending claim as its item owner or an admin' })
  reject(
    @CurrentUser() user: { id: number; role: string },
    @Param('claimId', ParseIntPipe) claimId: number,
  ) {
    return this.claimsService.reject(claimId, user.id, user.role);
  }
}
