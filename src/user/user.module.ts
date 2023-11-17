import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user.entities';
import { DoWithExceptions } from 'src/do-with-exception/do-with-exception';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [UserController],
  providers: [UserService, DoWithExceptions],
  exports: [UserService],
})
export class UserModule {}
