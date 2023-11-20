import { Injectable, Logger } from '@nestjs/common';
import { CreateRoutineDto } from './dto/create-routine.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Routine } from './entities/routine.entity';
import { Repository } from 'typeorm';
import { DoWithExceptions } from 'src/do-with-exception/do-with-exception';

@Injectable()
export class RoutineService {
  constructor(
    @InjectRepository(Routine) private readonly routineRepository: Repository<Routine>,
    private readonly dowithException: DoWithExceptions,
    private readonly logger: Logger
  ) {}

  async getAllRoutines(grp_id: number): Promise<any>{
    const result = await this.routineRepository.createQueryBuilder('r')
                                               .leftJoin('group', 'g', 'g.grp_id = r.grp_id')
                                               .where('g.grp_id = :grp_id', {grp_id})
                                               .select([
                                                 'r.grp_id      AS grp_id'
                                                 , 'r.rout_name   AS rout_name'
                                                 , 'r.rout_desc   AS rout_desc'
                                                 , 'r.rout_repeat AS rout_repeat'
                                                 , 'r.rout_srt    AS rout_srt'
                                                 , 'r.rout_end    AS rout_end'
                                               ])
                                               .getRawMany();
    this.logger.debug(result);
    
    return result;
  }

  async createRoutine(grp_id: number, createRoutineDto: CreateRoutineDto): Promise<any> {
    const routList = await this.routineRepository.createQueryBuilder('r')
                                                 .leftJoin('group', 'g', 'g.grp_id = r.grp_id')
                                                 .where('g.grp_id = :grp_id', {grp_id})
                                                 .select([
                                                   'COUNT(*) AS cnt'
                                                 ])
                                                 .getRawOne();

    if(routList.cnt >= 3){
      throw this.dowithException.ExceedMaxRoutines;
    }

    createRoutineDto['grp_id'] = grp_id;

    return await this.routineRepository.save(createRoutineDto);
  }

  async deleteRoutine(rout_id: number): Promise<any> {
    return await this.routineRepository.softDelete({ rout_id });
  }
}
