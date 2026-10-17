import { Module } from '@nestjs/common';
import { CategoriesModule } from '../categories/categories.module.js';
import { LocationsModule } from '../locations/locations.module.js';
import { ItemsController } from './items.controller.js';
import { ItemsService } from './items.service.js';

@Module({
  imports: [CategoriesModule, LocationsModule],
  controllers: [ItemsController],
  providers: [ItemsService],
  exports: [ItemsService],
})
export class ItemsModule {}
