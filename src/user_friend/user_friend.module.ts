import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserFriend } from './entities/user_group.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserFriend])
  ],
})
export class UserFriendModule {}
