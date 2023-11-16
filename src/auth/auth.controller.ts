import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { UserRequestDto } from 'src/user/dto/user-request.dto';
import { UserResponseDto } from 'src/user/dto/user-response.dto';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('/signup')
  @UsePipes(ValidationPipe)
  signup(@Body() request: UserRequestDto): Promise<UserResponseDto> {
    return this.authService.signup(request);
  }

  @Get('/login/:user_id')
  login(@Param('user_id', ParseIntPipe) kakaoId: number): Promise<boolean> {
    return this.authService.login(kakaoId);
  }
}
