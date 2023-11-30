import { Module } from '@nestjs/common';
import { ItemInventory } from './entities/item-inventory.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ItemInventoryController } from './item-inventory.controller';
import { ItemInventoryService } from './item-inventory.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([ItemInventory])
  ],
  controllers: [ItemInventoryController],
  providers: [ItemInventoryService],
})
export class ItemInventoryModule {}
