import {
  Body,
  Controller,
  Delete,
  FileTypeValidator,
  FileValidator,
  Get,
  Headers,
  Logger,
  MaxFileSizeValidator,
  Param,
  ParseFilePipe,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  Query,
  Request,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { UserService } from './user.service';
import { UserRequestDto as UserRequestDto } from './dto/user-request.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { GetUsersByContactsDto } from './dto/get-users-by-contacts.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { MulterConfig } from 'src/utils/MulterConfigService';
import { AuthGuard } from '@nestjs/passport';
import { User } from '../../entities/user.entities';

@Controller('user')
export class UserController {
  constructor(
    private readonly usersService: UserService,
    private readonly multerConifg: MulterConfig,
  ) {}

  @Get('/')
  @UseGuards(AuthGuard('jwt'))
  async getUser(
    @Request() req,
  ): Promise<{ result }> {
    
    return await this.usersService.getUserInfo(req.user);
  }

  @UseInterceptors(FileInterceptor('profile'))
  @Post('/:user_id/profile')
  async createUserProfile(
    @Param('user_id', ParseIntPipe) id: number,
    @UploadedFile() profile: Express.Multer.File,
  ): Promise<boolean> {
    this.multerConifg.changePath(process.env.PUBLIC_IMAGE_PATH);
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

  @Delete('/:user_id')
  async deleteUser(@Param('user_id', ParseIntPipe) id: number): Promise<void> {
    return await this.usersService.deleteUser(id);
  }

  @Post('/contacts')
  @UsePipes(ValidationPipe)
  async getUsersByContacts(
    @Body() body: GetUsersByContactsDto,
  ): Promise<UserResponseDto[]> {
    return await this.usersService.getUsersByContacts(body);
  }
}