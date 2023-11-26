import { Module } from '@nestjs/common';
import { GroupController } from './group.controller';
import { GroupService } from './group.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Group } from './entities/group.entity';
import { UserGroup } from 'src/user_group/entities/user_group.entity';
import { DoWithExceptions } from 'src/do-with-exception/do-with-exception';
import { UtilsModule } from 'src/utils/utils.module';
import { MulterConfig } from 'src/utils/fileUpload/MulterConfigService';
import { Todo } from 'src/todo/todo.entity';

@Module({
  imports: [
      TypeOrmModule.forFeature([Group, UserGroup, Todo]),
      UtilsModule
  ],
  controllers: [GroupController],
  providers: [ GroupService, DoWithExceptions, MulterConfig]
})
export class GroupModule {}