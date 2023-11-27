import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Achievements } from './entities/achievements.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Achievements])],
})
export class AchievementsModule {}
