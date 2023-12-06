import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { FriendService } from './friend.service';
import { FreindRequestDto } from './dto/friend-request.dto';

@Controller('friend')
export class FriendController {
  constructor(private readonly friendService: FriendService) {}

  @Get('/:user_id')
  getFriends(@Param('user_id') firends: number): Promise<{ result, total }>{
    return this.friendService.getFriends(firends);
  }

  @Get('/:user_id/:friend_id')
  getFriendStatus(
    @Param('user_id') user_id: number,
    @Param('friend_id') friend_id: number
  ){
    return this.friendService.getFriendStatus(user_id, friend_id);
  }

  @Post('/')
  @UsePipes(ValidationPipe)
  createFriend(@Body() body: FreindRequestDto): Promise<{ result }> {
    return this.friendService.createFriend(body);
  }

  @Delete('/')
  deleteFriend(@Body() body: FreindRequestDto): Promise<{ result }>{
    return this.friendService.deleteFriend(body);
  }
}
