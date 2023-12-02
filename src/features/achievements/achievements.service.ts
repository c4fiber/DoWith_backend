import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserAchi } from 'src/entities/user_achi.entity';
import { Repository } from 'typeorm';

@Injectable()
export class AchievementsService {
  constructor(
    @InjectRepository(UserAchi)
    private readonly userAchiRepo: Repository<UserAchi>
  ){}

  async createAchievement(user_id: number, achi_id: number){
    const result = await this.userAchiRepo.save({ user_id, achi_id });

    return { result };
  }
}
