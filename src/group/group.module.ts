import { Logger, Module } from '@nestjs/common';
import { GroupController } from './group.controller';
import { GroupService } from './group.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Group } from './entities/group.entity';
import { UserGroup } from 'src/user_group/entities/user_group.entity';
import { Todo } from 'src/todo/todo.entity';
import { DoWithExceptions } from 'src/do-with-exception/do-with-exception';

@Module({
  imports: [TypeOrmModule.forFeature([Group, UserGroup, Todo])],
  controllers: [GroupController],
  providers: [Logger, GroupService, DoWithExceptions]
})
export class GroupModule {}