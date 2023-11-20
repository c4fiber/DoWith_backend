import { Injectable, Logger } from '@nestjs/common';
import { CreateRoutineDto } from './dto/create-routine.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Routine } from './entities/routine.entity';
import { Repository } from 'typeorm';

@Injectable()
export class RoutineService {
  constructor(
    @InjectRepository(Routine) private readonly routineRepository: Repository<Routine>,
    private readonly logger: Logger
  ) {}

  async createRoutine(createRoutineDto: CreateRoutineDto) {
    return await this.routineRepository.save(createRoutineDto);
  }

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
}
