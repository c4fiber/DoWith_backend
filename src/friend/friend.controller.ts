import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { UserService } from 'src/user/user.service';
import { FriendService } from './friend.service';
import { FreindRequestDto } from './dto/friend-request.dto';

@Controller('friend')
export class FriendController {
  constructor(private readonly friendService: FriendService) {}

  @Get('/:user_id')
  async getFriends(@Param('user_id', ParseIntPipe) id: number) {
    return await this.friendService.getFriends(id);
  }

  @Post('/')
  @UsePipes(ValidationPipe)
  async createFriend(@Body() body: FreindRequestDto) {
    return await this.createFriend(body);
  }

  @Delete('/')
  async deleteFriend(@Body() body: FreindRequestDto) {
    return await this.deleteFriend(body);
  }
}
