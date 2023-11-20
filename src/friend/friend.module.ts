import { Module } from '@nestjs/common';
import { FriendController } from './friend.controller';
import { FriendService } from './friend.service';
import { UserService } from 'src/user/user.service';

@Module({
  controllers: [FriendController],
  providers: [FriendService, UserService],
})
export class FriendModule {}
