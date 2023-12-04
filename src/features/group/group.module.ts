import { Module } from '@nestjs/common';
import { GroupController } from './group.controller';
import { GroupService } from './group.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Group } from '../../entities/group.entity';
import { DoWithExceptions } from 'src/utils/do-with-exception';
import { UtilsModule } from 'src/utils/utils.module';
import { MulterConfig } from 'src/utils/MulterConfigService';
import { Todo } from 'src/entities/todo.entity';

@Module({
  imports: [
      TypeOrmModule.forFeature([Group, Todo]),
      UtilsModule
  ],
  controllers: [GroupController],
  providers: [ GroupService, DoWithExceptions, MulterConfig],
  exports: [GroupService],
})
export class GroupModule {}