import { Module } from '@nestjs/common';
import { FriendController } from './friend.controller';
import { FriendService } from './friend.service';
import { DoWithExceptions } from 'src/do-with-exception/do-with-exception';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/user/user.entities';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [FriendController],
  providers: [FriendService, DoWithExceptions],
})
export class FriendModule {}
