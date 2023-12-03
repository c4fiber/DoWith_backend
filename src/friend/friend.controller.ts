import {
  Body,
  Controller,
  Delete,
  Get,
  Logger,
  Param,
  ParseIntPipe,
  Post,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { FriendService } from './friend.service';
import { FreindRequestDto } from './dto/friend-request.dto';
import { UserResponseDto } from 'src/user/dto/user-response.dto';

@Controller('friend')
export class FriendController {
  constructor(private readonly friendService: FriendService) {}

  @Get('/:user_id')
  async getFriends(@Param('user_id') firends: number): Promise<{ result, total }>{
    return await this.friendService.getFriends(firends);
  }

  @Post('/')
  @UsePipes(ValidationPipe)
  async createFriend(@Body() body: FreindRequestDto): Promise<{ result }> {
    return await this.friendService.createFriend(body);
  }

  @Delete('/')
  async deleteFriend(@Body() body: FreindRequestDto): Promise<{ result }>{
    return await this.friendService.deleteFriend(body);
  }
}
