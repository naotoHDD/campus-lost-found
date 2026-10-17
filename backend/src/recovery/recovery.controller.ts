import { Body, Controller, Param, ParseIntPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { RecoveryService } from './recovery.service.js';
import { RecoveryConfirmationDto, RecoveryCodeDto, RecoveryMeetingDto } from './dto/recovery.dto.js';

@Controller('recovery')
@ApiTags('Recovery')
export class RecoveryController {
  constructor(private readonly recoveryService: RecoveryService) {}

  @Patch(':claimId/meeting')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Schedule or update a meeting for an accepted claim' })
  updateMeeting(
    @CurrentUser() user: { id: number; role: string },
    @Param('claimId', ParseIntPipe) claimId: number,
    @Body() dto: RecoveryMeetingDto,
  ) {
    return this.recoveryService.updateMeeting(claimId, user.id, user.role, dto);
  }

  @Post(':claimId/verify-code')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Verify the six-digit recovery code' })
  verifyCode(
    @CurrentUser() user: { id: number; role: string },
    @Param('claimId', ParseIntPipe) claimId: number,
    @Body() dto: RecoveryCodeDto,
  ) {
    return this.recoveryService.verifyCode(claimId, user.id, user.role, dto.code);
  }

  @Patch(':claimId/confirm')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Record a finder or claimant handoff confirmation' })
  confirm(
    @CurrentUser() user: { id: number; role: string },
    @Param('claimId', ParseIntPipe) claimId: number,
    @Body() dto: RecoveryConfirmationDto,
  ) {
    return this.recoveryService.confirm(claimId, user.id, user.role, dto.confirmation);
  }
}
