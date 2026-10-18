import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AdminModule } from './admin/admin.module.js';
import { AutomationModule } from './automation/automation.module.js';
import { AuthModule } from './auth/auth.module.js';
import { CategoriesModule } from './categories/categories.module.js';
import { ClaimsModule } from './claims/claims.module.js';
import { PrismaModule } from './common/prisma/prisma.module.js';
import { ItemsModule } from './items/items.module.js';
import { HealthModule } from './health/health.module.js';
import { LocationsModule } from './locations/locations.module.js';
import { NotificationsModule } from './notifications/notifications.module.js';
import { RecoveryModule } from './recovery/recovery.module.js';
import { UsersModule } from './users/users.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    UsersModule,
    AuthModule,
    CategoriesModule,
    LocationsModule,
    NotificationsModule,
    HealthModule,
    ItemsModule,
    ClaimsModule,
    RecoveryModule,
    AdminModule,
    AutomationModule,
  ],
})
export class AppModule {}
