import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user.entities';
import { DoWithExceptions } from 'src/do-with-exception/do-with-exception';
import { UtilsModule } from 'src/utils/utils.module';
import { MulterConfig } from 'src/utils/fileUpload/MulterConfigService';

@Module({
  imports: [
      TypeOrmModule.forFeature([User])
    , UtilsModule
  ],
  controllers: [UserController],
  providers: [UserService, DoWithExceptions, MulterConfig],
  exports: [UserService],
})
export class UserModule {}
