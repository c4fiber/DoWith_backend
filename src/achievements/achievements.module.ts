import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Achievements } from './entities/achievements.entity';
import { AchievementsService } from './achievements.service';
import { AchievementsController } from './achievements.controller';
import { UserAchi } from 'src/user_achi/entities/user_group.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Achievements, UserAchi])],
  providers: [AchievementsService],
  controllers: [AchievementsController],
})
export class AchievementsModule {}
