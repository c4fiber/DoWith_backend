import { Controller, Get, Headers, Logger, Query } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('/login')
  async login(@Headers('Authorization') token: string): Promise<boolean> {
    return await this.authService.login(token);
  }

  @Get('/')
  async oauth(
    @Query('code') code: string,
    @Query('error') error: string,
    @Query('state') state: string,
    @Query('error_description') desc: string,
  ) {
    Logger.debug(`code: ${code}`);
    Logger.debug(`error: ${error}`);
    Logger.debug(`state: ${state}`);
    Logger.debug(`description: ${desc}`);

    if (error) {
      // TODO: 만약 error이면 error message html 띄워줘야 함
      Logger.log(`Error while kakao auth. ${error}: ${desc} `);
      return;
    }

    // Get token from kakao server
    return await this.authService.oauth(code);
  }
}
