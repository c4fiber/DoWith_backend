import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Todo } from './todo.entity';
import { CreateTodoDto } from './dto/create-todo.dto';
import { UpdateTodoDto } from './dto/update-todo.dto';

@Injectable()
export class TodoService {
  constructor(
    @InjectRepository(Todo)
    private readonly todoRepository: Repository<Todo>,
    private readonly dataSource: DataSource
  ) {}

  // READ
  async findAllByUser(user_id: number): Promise<Todo[]> {
    return await this.todoRepository
      .createQueryBuilder('todo')
      .where('todo.user_id = :user_id', { user_id })
      .andWhere('todo.todo_deleted = :todo_deleted', { todo_deleted: false })
      .orderBy('todo.todo_date', 'ASC')
      .orderBy('todo.todo_id', 'ASC')
      .getMany();
    // return await this.todoRepository.findBy({ user_id, todo_deleted: false });
  }

  async createTodayTodo(user_id: number){
    const queryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try{
      // last로그인 비교해주고 오늘날짜로 변경해줘야 할듯ㅇ

      const result = await queryRunner.query(`
        INSERT INTO todo (user_id, todo_name, todo_desc, todo_label, todo_start, todo_end, grp_id, rout_id)
        SELECT ${user_id} AS user_id
             , r.rout_name AS todo_name
             , r.rout_desc AS todo_desc
             , 99 AS todo_label -- 임시 값(routine에 cat_id 컬럼 추가되면 변경 해야함)
             , r.rout_srt AS todo_start
             , r.rout_end AS todo_end
             , r.grp_id
             , r.rout_id
          FROM "routine" r
          LEFT OUTER JOIN "days" d 
            ON r.rout_repeat = d.rout_repeat
         WHERE r.grp_id IN (
                            SELECT g.grp_id
                              FROM user_group ug
                              LEFT OUTER JOIN "group" g ON ug.grp_id = g.grp_id
                             WHERE ug.user_id = ${user_id}
                           )
           AND to_char(now(), 'dy') = ANY(d.days)
      `);

      await queryRunner.commitTransaction();

      return { result };
    } catch(err){
      await queryRunner.rollbackTransaction();
      throw new Error(err);
    } finally {
      await queryRunner.release();
    }
  }

  async findOne(todo_id: number): Promise<Todo> {
    return await this.todoRepository.findOneBy({
      todo_id,
      todo_deleted: false,
    });
  }

  // CREATE
  async create(createTodoDto: CreateTodoDto): Promise<Todo> {
    const todo = new Todo();
    Object.keys(createTodoDto).forEach((key) => {
      if (createTodoDto[key] !== undefined && createTodoDto[key] !== null) {
        todo[key] = createTodoDto[key];
      }
    });

    // // todo_id, todo_deleted: default
    // todo.user_id = createTodoDto.user_id;

    // todo.todo_name = createTodoDto.todo_name;
    // todo.todo_desc = createTodoDto.todo_desc;
    // todo.todo_label = createTodoDto.todo_label;
    // todo.todo_date = createTodoDto.todo_date;
    // todo.todo_done = createTodoDto.todo_done;

    // todo.todo_start = createTodoDto.todo_start;
    // todo.todo_end = createTodoDto.todo_end;
    // todo.grp_id = createTodoDto.grp_id;
    // todo.todo_img = createTodoDto.todo_img;

    return await this.todoRepository.save(todo);
  }

  // UPDATE
  async update(todo_id: number, dto: UpdateTodoDto): Promise<Todo> {
    const todo = await this.todoRepository.findOneBy({ todo_id });

    Object.keys(dto).forEach((key) => {
      if (dto[key] !== null && dto[key] !== undefined) {
        todo[key] = dto[key];
      }
    });

    return await this.todoRepository.save(todo);
  }

  // DELETE
  async delete(todo_id: number): Promise<void> {
    const todo = await this.todoRepository.findOneBy({ todo_id });
    todo.todo_deleted = true;
    await this.todoRepository.save(todo);
  }

  // todo 완료상태 변경
  async editDone(todo_id: number, dto: UpdateTodoDto): Promise<Todo> {
    const todo = await this.todoRepository.findOneBy({ todo_id });
    todo.todo_done = dto.todo_done;

    return this.todoRepository.save(todo);
  }
}
