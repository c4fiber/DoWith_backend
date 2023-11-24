import { Injectable, Logger } from '@nestjs/common';
import { CreateRoutineDto } from './dto/create-routine.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Routine } from './entities/routine.entity';
import { DataSource, Repository } from 'typeorm';
import { DoWithExceptions } from 'src/do-with-exception/do-with-exception';
import { Group } from 'src/group/entities/group.entity';
import { Todo } from 'src/todo/todo.entity';

@Injectable()
export class RoutineService {
  constructor(
    @InjectRepository(Routine) private readonly routineRepository: Repository<Routine>,
    private readonly dowithException: DoWithExceptions,
    private dataSource: DataSource,
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

    const queryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try{
      createRoutineDto['grp_id'] = grp_id;

      const routIns = await queryRunner.manager.save(Routine, createRoutineDto);
      const memList = await queryRunner.manager.createQueryBuilder()
                                               .select('ug.user_id AS user_id')
                                               .from(Group, 'g')
                                               .leftJoin('user_group', 'ug', 'g.grp_id = ug.grp_id')
                                               .where('g.grp_id = :grp_id', { grp_id })
                                               .getRawMany();
      this.logger.debug(routIns);
      memList.forEach(async (data) => { 
        const todo = new Todo();
        // local inmemory에서 해결할 루틴으로 To-Do 만들기임
        todo['user_id'] = data.user_id;
        todo.grp_id = grp_id;
        todo.todo_name = routIns.rout_name;
        todo.todo_desc = routIns.rout_desc;
        todo.todo_start = routIns.rout_srt;
        todo.todo_end = routIns.rout_end;
        todo.todo_label = 0;

        await queryRunner.manager.save(Todo, todo);
      });

      //return;
      await queryRunner.commitTransaction();
      return;

    } catch(err){
      this.logger.error(err);
      await queryRunner.rollbackTransaction();
    }
  }

  async deleteRoutine(rout_id: number): Promise<any> {
    return await this.routineRepository.softDelete({ rout_id });
  }
}
