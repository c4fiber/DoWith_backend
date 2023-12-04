import { Module } from '@nestjs/common';
import { ItemInventory } from '../../entities/item-inventory.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ItemInventoryController } from './item-inventory.controller';
import { ItemInventoryService } from './item-inventory.service';
import { ItemShop } from 'src/entities/item-shop.entity';
import { DoWithExceptions } from 'src/utils/do-with-exception';

@Module({
  imports: [
    TypeOrmModule.forFeature([ItemInventory]),
    TypeOrmModule.forFeature([ItemShop]),
  ],
  controllers: [ItemInventoryController],
  providers: [ItemInventoryService, DoWithExceptions],
})
export class ItemInventoryModule {}
