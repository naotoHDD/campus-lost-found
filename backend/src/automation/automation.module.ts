import { Module } from '@nestjs/common';
import { AutomationController } from './automation.controller.js';
import { AutomationKeyGuard } from './automation-key.guard.js';
import { AutomationService } from './automation.service.js';

@Module({
  controllers: [AutomationController],
  providers: [AutomationService, AutomationKeyGuard],
})
export class AutomationModule {}
