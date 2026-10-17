import { Module } from '@nestjs/common';
import { PrismaModule } from '../common/prisma/prisma.module.js';
import { NotificationsController } from './notifications.controller.js';

@Module({
  imports: [PrismaModule],
  controllers: [NotificationsController],
})
export class NotificationsModule {}