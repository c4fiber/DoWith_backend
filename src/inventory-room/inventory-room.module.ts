import { Module } from '@nestjs/common';
import { InventoryRoomService } from './inventory-room.service';
import { InventoryRoomController } from './inventory-room.controller';

@Module({
  controllers: [InventoryRoomController],
  providers: [InventoryRoomService],
})
export class InventoryRoomModule {}
