import { Injectable, Logger } from '@nestjs/common';
import { CreateRoutineDto } from './dto/create-routine.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Routine } from '../../entities/routine.entity';
import { DataSource, Repository } from 'typeorm';
import { DoWithExceptions } from 'src/utils/do-with-exception';
import { Group } from 'src/entities/group.entity';
import { Todo } from 'src/entities/todo.entity';

@Injectable()
export class RoutineService {
  constructor(
    @InjectRepository(Routine)
    private readonly routineRepository: Repository<Routine>,
    private readonly dowithException: DoWithExceptions,
    private dataSource: DataSource
  ) {}

  async getAllRoutines(grp_id: number): Promise<any> {
    const result = await this.routineRepository.createQueryBuilder('r')
                                               .leftJoin('group', 'g', 'g.grp_id = r.grp_id')
                                               .leftJoin('days' , 'd', 'r.rout_repeat = d.rout_repeat')
                                               .where('g.grp_id = :grp_id', { grp_id })
                                               .select([
                                                 'r.grp_id      AS grp_id'
                                               , 'r.rout_name   AS rout_name'
                                               , 'r.rout_desc   AS rout_desc'
                                               , 'r.rout_repeat AS rout_repeat'
                                               , 'r.rout_srt    AS rout_srt'
                                               , 'r.rout_end    AS rout_end'
                                               , 'd.days        AS days'
                                               ])
                                               .getRawMany();

    return { result };
  }

  async createRoutine(
    grp_id: number,
    createRoutineDto: CreateRoutineDto,
  ): Promise<any> {
    const routCnt = await this.routineRepository.createQueryBuilder('r')
                                                .leftJoin('group', 'g', 'g.grp_id = r.grp_id')
                                                .where('g.grp_id = :grp_id', { grp_id })
                                                .getCount();

    // 그룹 최대 등록 개수 3개: 후에 그룹 생성시에만 루틴 만들 수 있어서 필요 없어질 예정
    if (routCnt >= 3) {
      throw this.dowithException.ExceedMaxRoutines;
    }

    const queryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      createRoutineDto['grp_id'] = grp_id;

      const result = await queryRunner.manager.save(Routine, createRoutineDto);
      const memList = await queryRunner.manager.createQueryBuilder()
                                               .select('ug.user_id AS user_id')
                                               .from(Group, 'g')
                                               .leftJoin('user_group', 'ug', 'g.grp_id = ug.grp_id')
                                               .where('g.grp_id = :grp_id', { grp_id })
                                               .getRawMany();
      for(const data of memList){
        const todo = new Todo();
        // local storage 해결할 루틴으로 To-Do 만들기임
        todo['user_id'] = data.user_id;
        todo.grp_id = grp_id;
        todo.todo_name = result.rout_name;
        todo.todo_desc = result.rout_desc;
        todo.todo_start = result.rout_srt;
        todo.todo_end = result.rout_end;
        todo.todo_label = 0;

        await queryRunner.manager.save(Todo, todo);
      }

      await queryRunner.commitTransaction();
      return { result };
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw new Error(err);
    } finally {
      await queryRunner.release();
    }
  }

  async deleteRoutine(rout_id: number): Promise<any> {
    const result = await this.routineRepository.softDelete({ rout_id });
    return { result };
  }
}