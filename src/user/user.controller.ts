import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  Query,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { UserService } from './user.service';
import { UserRequestDto } from './dto/user-request.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { FriendRequestDto } from './dto/friend-request.dto';

@Controller('user')
export class UserController {
  constructor(private readonly usersService: UserService) {}

  @Get('/:user_id')
  async getUser(
    @Param('user_id', ParseIntPipe) id: number,
  ): Promise<UserResponseDto> {
    return this.usersService.getUser(id);
  }

  @Put('/:user_id')
  @UsePipes(new ValidationPipe())
  async updateUser(
    @Param('user_id', ParseIntPipe) id: number,
    @Body() request: UserRequestDto,
  ): Promise<boolean> {
    return this.usersService.updateUser(id, request);
  }

  @Patch('/:user_id')
  async updateUserHp(
    @Param('user_id', ParseIntPipe) id: number,
    @Query('hp', ParseIntPipe) hp: number,
  ): Promise<boolean> {
    return this.usersService.updateHp(id, hp);
  }

  @Delete('/:user_id')
  async deleteUser(@Param('user_id', ParseIntPipe) id: number): Promise<void> {
    return this.usersService.deleteUser(id);
  }

  @Get('/:user_id/friend')
  async getUserFriends() {
    return '친구조회';
  }

  @Post(':user_id/friend/:friend_id')
  @UsePipes(new ValidationPipe())
  async addUserFriend(
    @Param('user_id', ParseIntPipe) id: number,
    @Body() request: FriendRequestDto,
  ) {
    return `유저: ${id} 친구 ${request.friend_id}`;
  }
}
