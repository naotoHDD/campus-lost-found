import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { PrismaService } from '../common/prisma/prisma.service.js';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@ApiTags('Notifications')
export class NotificationsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('my')
  @ApiOperation({ summary: 'List notifications for the authenticated user' })
  listMine(@CurrentUser() user: { id: number }) {
    return this.prisma.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        userId: true,
        title: true,
        message: true,
        isRead: true,
        createdAt: true,
      },
    });
  }
}
