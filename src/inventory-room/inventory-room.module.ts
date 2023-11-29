import { Module } from '@nestjs/common';
import { InventoryRoomService } from './inventory-room.service';
import { InventoryRoomController } from './inventory-room.controller';
import { ItemInventoryModule } from 'src/item-inventory/item-inventory.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ItemInventory } from 'src/item-inventory/entities/item-inventory.entity';
import { InventoryRoom } from './entities/inventory-room.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ItemInventory, InventoryRoom])],
  controllers: [InventoryRoomController],
  providers: [InventoryRoomService],
})
export class InventoryRoomModule {}
