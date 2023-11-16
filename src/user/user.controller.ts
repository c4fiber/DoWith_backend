import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';

@Controller('user')
export class UserController {
  constructor(private usersService: UserService) {}

  @Get('/:id')
  async getUser(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.getUser(id);
  }

  @Get('/')
  async getUsers() {
    // TODO:
  }

  @Post('/')
  async createUser(@Body() request: CreateUserDto): Promise<number> {
    return this.usersService.createUser(request);
  }

  @Put('/:id')
  async updateUser(
    @Param('id', ParseIntPipe) id: number,
    @Body() request: CreateUserDto,
  ) {
    return this.usersService.updateUser(id, request);
  }

  @Delete('/:id')
  async deleteUser(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.deleteUser(id);
  }
}
