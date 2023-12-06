import { Module } from '@nestjs/common';
import { GroupModule } from './group/group.module';
import { UserModule } from './user/user.module';
import { CategoryModule } from './category/category.module';
import { ItemShopModule } from './item-shop/item-shop.module';
import { AchievementsModule } from './achievements/achievements.module';
import { TodoModule } from './todo/todo.module';
import { RoutineModule } from './routine/routine.module';
import { FriendModule } from './friend/friend.module';
import { CommentModule } from './comment/comment.module';
import { ItemInventoryModule } from './item-inventory/item-inventory.module';
import { RoomModule } from './room/room.module';
import { NotificationModule } from './notification/notification.module';
import { AnnouncementModule } from './announcement/announcement.module';

@Module({
  providers: [
    // Fixed Data Table
      AchievementsModule
    , CategoryModule
    , ItemShopModule

    // APIs
    , AnnouncementModule
    , CommentModule
    , FriendModule
    , GroupModule
    , ItemInventoryModule
    , NotificationModule
    , RoomModule
    , RoutineModule
    , TodoModule
    , UserModule
  ],
  exports: []
})
export class FeatureModule {}