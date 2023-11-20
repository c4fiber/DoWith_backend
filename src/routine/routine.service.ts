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

  async getAllRoutines(group_id: number){
    // const result = await this.routineRepository.find({
    //   relations: ['group'],
    //   where: { group: { group_id }},
    // });

    const result = await this.routineRepository.createQueryBuilder('routine')
                                               .innerJoinAndSelect('routine.group_id', 'group')
                                               .where('group_id = :group_id', {group_id})
                                               .getMany();
    this.logger.debug(result);
    return;
  }
}
