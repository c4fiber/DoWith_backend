import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Category } from './category.entity';
import { Days } from './days.entity';
import { Comment } from './comment.entity';
import { doWithError } from './error.entity';
import { Group } from './group.entity';
import { ItemInventory } from './item-inventory.entity';
import { ItemShop } from './item-shop.entity';
import { ItemType } from './item-type.entity';
import { Room } from './room.entity';
import { Routine } from './routine.entity';
import { Todo } from './todo.entity';
import { User } from './user.entities';
import { UserGroup } from 'src/entities/user_group.entity';
import { UserAchi } from './user_achi.entity';
import { UserFriend } from 'src/entities/user_friend.entity';
import { Achievements } from './achievements.entity';
import { Announcement } from './announcement.entity';
import { Attendance } from './attendance.entity';

@Module({
  imports: [TypeOrmModule.forFeature([
      Achievements
    , Category
    , Comment
    , Days
    , doWithError
    , Group
    , ItemInventory
    , ItemShop
    , ItemType
    , Comment
    , Room
    , Routine
    , Todo
    , User
    , UserAchi
    , UserFriend
    , UserGroup
    , Announcement
    , Attendance
  ])]
})
export class EntitiesModule {}
