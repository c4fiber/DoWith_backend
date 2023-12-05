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
import { SignUpDto } from './dto/singup.dto';
import { User } from 'src/entities/user.entities';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

//   @Get('/user')
//   @UseGuards(AuthGuard())
//   async getUserInfo(
//     @Request() req,
//     @Headers('Authorization') token: string
//   ) {
//     const user = req.user;
//     return await this.authService.getUserInfo(user.user_id, token);
//   }

  @Post('/valid')
  async isUserNameUnique(@Body('user_name') user_name: string) {
    return await this.authService.isUserNameUnique(user_name);
  }

  @Post('/signup')
  @UsePipes(ValidationPipe)
  async singup(@Body() body: SignUpDto) {
    return await this.authService.signup(body);
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
