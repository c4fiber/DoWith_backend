import {
  Controller,
  Get,
  Body,
  Param,
  Put,
} from '@nestjs/common';
import { RoomService } from './room.service';

@Controller('room')
export class RoomController {
  constructor(private readonly roomService: RoomService) {}

  @Put(':user_id')
  overlapIteminMyRoom(@Param('user_id') user_id: number, @Body() body: any) {
    return this.roomService.overlap(user_id, body['items']);
  }

  @Get(':user_id')
  getAllItemsInMyRoom(@Param('user_id') user_id: number) {
    return this.roomService.findAll(user_id);
  }
}
