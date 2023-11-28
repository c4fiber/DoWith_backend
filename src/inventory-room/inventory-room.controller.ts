import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { InventoryRoomService } from './inventory-room.service';

@Controller('inventory-room')
export class InventoryRoomController {
  constructor(private readonly inventoryRoomService: InventoryRoomService) {}

  @Post(':user_id/:item_id')
  putIteminMyRoom(@Param('user_id') user_id: number, @Param('item_id') item_id: number) {
    return this.inventoryRoomService.create(user_id, item_id);
  }

  @Get(':user_id/')
  getAllItemsInMyRoom(@Param('user_id') user_id: number) {
    return this.inventoryRoomService.findAll(user_id);
  }

  @Delete(':user_id/:item_id')
  removeIteminMyRoom(@Param('user_id') user_id: number, @Param('item_id') item_id: number) {
    return this.inventoryRoomService.remove(user_id, item_id);
  }
}
