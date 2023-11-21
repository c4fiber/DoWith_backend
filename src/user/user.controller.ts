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
import { UserRequestDto as UserRequestDto } from './dto/user-request.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { GetUsersByContactsDto } from './dto/get-users-by-contacts.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';

@Controller('user')
export class UserController {
  constructor(private readonly usersService: UserService) {}

  @Get('/:user_id')
  async getUser(
    @Param('user_id', ParseIntPipe) id: number,
  ): Promise<UserResponseDto> {
    return await this.usersService.getUser(id);
  }

  @Get('/')
  async getUserByKakakoId(
    @Query('user_kakao_id') kakaoId: string,
  ): Promise<UserResponseDto> {
    return await this.usersService.getUserByKakaoId(kakaoId);
  }

  @Get('/')
  async getUserByName(
    @Query('user_name') name: string,
  ): Promise<UserResponseDto> {
    return await this.usersService.getUserByName(name);
  }

  @Post('/')
  @UsePipes(ValidationPipe)
  async createUser(@Body() body: UserRequestDto): Promise<UserResponseDto> {
    return await this.usersService.createUser(body);
  }

  @Post('/:user_id/profile')
  @UseInterceptors(
    FileInterceptor('profile', {
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: (_, file, callback) => {
        if (!file.originalname.match(/\.jpg$/)) {
          return callback(new Error('Only images are allowed.'), false);
        }
        callback(null, true);
      },
      storage: diskStorage({
        destination: './public/image',
        filename: (_, file, callback) => {
          if (file) {
            // 파일이 있을 떄만 저장
            callback(null, file.originalname);
          }
        },
      }),
    }),
  )
  async createUserProfile(
    @Param('user_id', ParseIntPipe) id: number,
    @UploadedFile() profile: Express.Multer.File,
  ): Promise<boolean> {
    // TODO: type, size, .. 검증 로직, 디스크 공간 체크
    return true;
  }

  @Put('/:user_id')
  @UsePipes(new ValidationPipe())
  async updateUser(
    @Param('user_id', ParseIntPipe) id: number,
    @Body() request: UserRequestDto,
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

  @Delete('/')
  async deleteUserByKakaoId(
    @Query('user_kakao_id') kakao_id: string,
  ): Promise<void> {
    return await this.usersService.deleteUserByKakaoId(kakao_id);
  }

  @Post('/contacts')
  @UsePipes(ValidationPipe)
  async getUsersByContacts(
    @Body() body: GetUsersByContactsDto,
  ): Promise<UserResponseDto[]> {
    return await this.usersService.getUsersByContacts(body);
  }
}
