import { Logger, Module } from '@nestjs/common';
import { GroupController } from './group.controller';
import { GroupService } from './group.service';

@Module({
  controllers: [GroupController],
  providers: [Logger, GroupService]
})
export class GroupModule {}