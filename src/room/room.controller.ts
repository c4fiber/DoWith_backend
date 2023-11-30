import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { RoomService } from './room.service';

@Controller('room')
export class RoomController {
  constructor(private readonly roomService: RoomService) {}

  @Post(':user_id/:item_id')
  putIteminMyRoom(@Param('user_id') user_id: number, @Param('item_id') item_id: number) {
    return this.roomService.create(user_id, item_id);
  }

  @Get(':user_id/')
  getAllItemsInMyRoom(@Param('user_id') user_id: number) {
    return this.roomService.findAll(user_id);
  }

  @Delete(':user_id/:item_id')
  removeIteminMyRoom(@Param('user_id') user_id: number, @Param('item_id') item_id: number) {
    return this.roomService.remove(user_id, item_id);
  }
}
