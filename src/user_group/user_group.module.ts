import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserGroup } from './entities/user_group.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserGroup])
],
})
export class UserGroupModule {}
