import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiHeader, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AutomationKeyGuard } from './automation-key.guard.js';
import { AutomationService } from './automation.service.js';
import { RunMatchingDto } from './dto/run-matching.dto.js';

@Controller('automation')
@UseGuards(AutomationKeyGuard)
@ApiTags('Automation')
@ApiHeader({ name: 'x-automation-key', required: true })
export class AutomationController {
  constructor(private readonly automationService: AutomationService) {}

  @Post('matches/run')
  @ApiOperation({ summary: 'Process unhandled lost/found items and create match notifications' })
  runMatching(@Body() dto: RunMatchingDto) {
    return this.automationService.runItemMatching(dto.limit, dto.minimumScore);
  }
}
