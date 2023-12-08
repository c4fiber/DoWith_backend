import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Attendance } from 'src/entities/attendance.entity';
import { Repository } from 'typeorm';

@Injectable()
export class AttendanceService {
  constructor(
    @InjectRepository(Attendance)
    private readonly atteRepo: Repository<Attendance>
  ){}

  async getAllAttendances(user_id: number){
    const result = await this.atteRepo.createQueryBuilder()
                                      .select([
                                        'user_id AS user_id'
                                      , 'atte_at AS atte_at'
                                      , `extract(dow from TO_DATE(atte_at, 'YYYYMMDD')) AS day_of_week`
                                      ])
                                      .where('user_id = :user_id', { user_id })
                                      .andWhere(`TO_DATE(atte_at, 'YYYYMMDD') > CURRENT_DATE - EXTRACT(DOW FROM CURRENT_DATE)::INTEGER`)
                                      .andWhere(`TO_DATE(atte_at, 'YYYYMMDD') <= CURRENT_DATE + (7 - EXTRACT(DOW FROM CURRENT_DATE)::INTEGER)`)
                                      .orderBy('atte_at', 'ASC')
                                      .getRawMany();

    return { result };
  }
}
