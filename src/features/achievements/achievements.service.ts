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

  async getUserAchievements(user_id: number){
    const result = await this.userAchiRepo.createQueryBuilder('ua')
                                          .select([
                                            'ac.achi_name AS achi_name'
                                          , 'ac.achi_desc AS achi_desc'
                                          , 'ac.is_hidden AS is_hidden'
                                          , 'ac.achi_img  AS achi_img'
                                          ])
                                          .leftJoin('achievements', 'ac', 'ua.achi_id = ac.achi_id')
                                          .where('ua.user_id = :user_id', { user_id })
                                          .getRawMany();

    return { result };
  }

  async createAchievement(user_id: number, achi_id: number){
    const result = await this.userAchiRepo.save({ user_id, achi_id });

    return { result };
  }
}
