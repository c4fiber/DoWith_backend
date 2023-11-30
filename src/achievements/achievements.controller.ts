import { Controller, Param, Post } from '@nestjs/common';
import { AchievementsService } from './achievements.service';

@Controller('achievements')
export class AchievementsController {
  constructor(
    private readonly achiService: AchievementsService
  ){}

  @Post('/:user_id/:achi_id')
  createAchievement(
    @Param('user_id') user_id: number,
    @Param('achi_id') achi_id: number
  ){
    return this.achiService.createAchievement(user_id, achi_id);
  }
}
