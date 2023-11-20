import {
  Body,
  Controller,
  Delete,
  FileTypeValidator,
  FileValidator,
  Get,
  MaxFileSizeValidator,
  Param,
  ParseFilePipe,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  Query,
  UploadedFile,
  UseInterceptors,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { UserService } from './user.service';
import { UserRequestDto as CreateUserDto } from './dto/user-request.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { FriendRequestDto } from './dto/friend-request.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { log } from 'console';

@Controller('user')
export class UserController {
  constructor(private readonly usersService: UserService) {}

  @Get('/:user_id')
  async getUser(
    @Param('user_id', ParseIntPipe) id: number,
  ): Promise<UserResponseDto> {
    return await this.usersService.getUser(id);
  }

  @Post('/')
  @UsePipes(ValidationPipe)
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: (_, file, callback) => {
        if (!file.originalname.match(/\.jpg$/)) {
          return callback(new Error('Only images are allowed.'), false);
        }
      },
      storage: diskStorage({
        destination: './public/image',
        filename: (_, file, callback) => {
          // const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          // const filename = `${uniqueSuffix}-${file.filename}`;
          console.log(`filename: ${file.filename}`);
          callback(null, file.filename);
        },
      }),
    }),
  )
  async createUser(
    @Body() body: CreateUserDto,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<UserResponseDto> {
    return await this.usersService.createUser(body);
  }

  @Put('/:user_id')
  @UsePipes(new ValidationPipe())
  async updateUser(
    @Param('user_id', ParseIntPipe) id: number,
    @Body() request: CreateUserDto,
  ): Promise<boolean> {
    return await this.usersService.updateUser(id, request);
  }

  @Patch('/:user_id')
  async updateUserHp(
    @Param('user_id', ParseIntPipe) id: number,
    @Query('hp', ParseIntPipe) hp: number,
  ): Promise<boolean> {
    return await this.usersService.updateHp(id, hp);
  }

  @Delete('/:user_id')
  async deleteUser(@Param('user_id', ParseIntPipe) id: number): Promise<void> {
    return await this.usersService.deleteUser(id);
  }

  //   @Post("/:user/profile")
  //   async createUserProfile(@Param('user_id'))

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
