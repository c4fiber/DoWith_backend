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
import { MulterConfig } from 'src/utils/fileUpload/MulterConfigService';

@Controller('user')
export class UserController {
  constructor(
      private readonly usersService: UserService
    , private readonly multerConifg: MulterConfig
  ) {
    this.multerConifg.changePath(process.env.PUBLIC_IMAGE_PATH);
  }

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

  @UseInterceptors(FileInterceptor('profile'))
  @Post('/:user_id/profile')
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
