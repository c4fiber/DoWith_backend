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
import { UserResponseDto } from 'src/user/dto/user-response.dto';

@Controller('friend')
export class FriendController {
  constructor(private readonly friendService: FriendService) {}

  @Get('/:user_id')
  async getFriends(
    @Param('user_id', ParseIntPipe) id: number,
  ): Promise<UserResponseDto[]> {
    return await this.friendService.getFriends(id);
  }

  @Post('/')
  @UsePipes(ValidationPipe)
  async createFriend(@Body() body: FreindRequestDto): Promise<boolean> {
    console.log(`🔥 ${JSON.stringify(body)}`);
    return await this.friendService.createFriend(body);
  }

  @Delete('/')
  async deleteFriend(@Body() body: FreindRequestDto): Promise<boolean> {
    return await this.friendService.deleteFriend(body);
  }
}
