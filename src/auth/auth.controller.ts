import {
  Controller,
  Get,
  Headers,
  Logger,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthGuard } from '@nestjs/passport';
import { Response } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('/login')
  @UseGuards(AuthGuard())
  async login(@Req() req): Promise<boolean> {
    Logger.log(`🔥 ${req}`);
    return false;
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
      Logger.log(`Error while kakao auth. ${error}: ${state} ${desc} `);
      return desc;
    }

    const redirectUri = await this.authService.oauth(code);
    return response.redirect(redirectUri);
  }

  @Post('/test')
  @UseGuards(AuthGuard())
  async test(@Req() req) {
    Logger.log(`@@ ${req}`);
  }
}
