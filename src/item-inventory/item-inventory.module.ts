import { Module } from '@nestjs/common';
import { ItemInventory } from './entities/item-inventory.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    TypeOrmModule.forFeature([ItemInventory])
  ],
})
export class ItemInventoryModule {}
