import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UserModule } from 'src/user/user.module';
import { DoWithExceptions } from 'src/do-with-exception/do-with-exception';
import { AuthController } from './auth.controller';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [UserModule, HttpModule],
  providers: [AuthService, DoWithExceptions],
  controllers: [AuthController],
})
export class AuthModule {}
