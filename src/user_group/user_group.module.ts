import { Module } from '@nestjs/common';
import { UserGroupService } from './user_group.service';
import { UserGroupController } from './user_group.controller';

@Module({
  controllers: [UserGroupController],
  providers: [UserGroupService],
})
export class UserGroupModule {}
