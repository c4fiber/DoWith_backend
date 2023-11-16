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

  async create(createRoutineDto: CreateRoutineDto) {
    return await this.routineRepository.save(createRoutineDto);
  }
}
