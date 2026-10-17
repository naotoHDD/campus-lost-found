import { Body, Controller, Get, Param, ParseIntPipe, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Roles } from '../common/decorators/roles.decorator.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../common/guards/roles.guard.js';
import { UsersService } from '../users/users.service.js';
import { ItemsService } from '../items/items.service.js';
import { UpdateUserRoleDto } from './dto/update-user-role.dto.js';
import { AdminService } from './admin.service.js';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@ApiTags('Admin')
@ApiBearerAuth()
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly usersService: UsersService,
    private readonly itemsService: ItemsService,
  ) {}

  @Get('stats')
  @ApiOperation({ summary: 'Read administrator dashboard statistics' })
  stats() {
    return this.adminService.stats();
  }

  @Get('users')
  @ApiOperation({ summary: 'List users without password data' })
  users() {
    return this.usersService.findAll();
  }

  @Patch('users/:id/role')
  @ApiOperation({ summary: 'Change a user role' })
  updateUserRole(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateUserRoleDto) {
    return this.usersService.updateRole(id, dto.role);
  }

  @Get('items')
  @ApiOperation({ summary: 'List items for administration with precise location data' })
  items() {
    return this.itemsService.list({ page: 1, limit: 100 }, { includePreciseLocation: true });
  }

  @Get('claims')
  @ApiOperation({ summary: 'List claims for administration' })
  claims() {
    return this.adminService.claims();
  }
}
