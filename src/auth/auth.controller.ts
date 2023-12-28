import {
  Body,
  Controller,
  Get,
  Headers,
  Logger,
  Post,
  Query,
  Req,
  Request,
  Res,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthGuard } from '@nestjs/passport';
import { Response } from 'express';
import { SignUpDto } from './dto/signup.dto';
import { User } from 'src/entities/user.entities';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('/valid')
  async isUserNameUnique(@Body('user_name') user_name: string) {
    return await this.authService.isUserNameUnique(user_name);
  }

  @Post('/signup')
  async singup(@Body() body: SignUpDto) {
    return await this.authService.register(body);
  }

  @Post('/login')
  async login(@Body() body: LoginDto) {
    return await this.authService.login(body);
  }

  @Get('/')
  async oauth(
    @Query('code') code: string,
    @Query('error') error: string,
    @Query('state') state: string,
    @Query('error_description') desc: string,
    @Res() response: Response,
  ) {
    if (error) {
      return desc;
    }
    const { token, kakao_id } = await this.authService.oauth(code);
    const redirectUri = `${process.env.APP_SCHEME}://oauth?token=${token}&kakao_id=${kakao_id}`;
    return response.redirect(redirectUri);
  }

  @Post('/test')
  @UseGuards(AuthGuard())
  async test(@Req() req) {
    return 'Hello World!';
  }
}
