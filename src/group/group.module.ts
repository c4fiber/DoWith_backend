import { Logger, Module } from '@nestjs/common';
import { GroupController } from './group.controller';
import { GroupService } from './group.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Group } from './entities/group.entity';
import { UserGroup } from 'src/user_group/entities/user_group.entity';
import { DoWithExceptions } from 'src/do-with-exception/do-with-exception';
import { UtilsModule } from 'src/utils/utils.module';
import { MulterConfigService } from 'src/utils/fileUpload/MulterConfigService';

@Module({
  imports: [
      TypeOrmModule.forFeature([Group, UserGroup]),
      UtilsModule
  ],
  controllers: [GroupController],
  providers: [Logger, GroupService, DoWithExceptions, MulterConfigService]
})
export class GroupModule {}