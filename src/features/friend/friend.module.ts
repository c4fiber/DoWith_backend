import { Module } from '@nestjs/common';
import { FriendController } from './friend.controller';
import { FriendService } from './friend.service';
import { DoWithExceptions } from 'src/utils/do-with-exception';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/entities/user.entities';
import { UserFriend } from 'src/entities/user_friend.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, UserFriend])],
  controllers: [FriendController],
  providers: [FriendService, DoWithExceptions],
})
export class FriendModule {}
