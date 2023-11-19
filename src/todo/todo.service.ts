import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Todo } from './todo.entity';
import { CreateTodoDto } from './dto/create-todo.dto';
import { UpdateTodoDto } from './dto/update-todo.dto';

@Injectable()
export class TodoService {
  constructor(
    @InjectRepository(Todo)
    private readonly todoRepository: Repository<Todo>,
  ) {}

  // READ
  async findAllByUser(user_id: number): Promise<Todo[]> {
    return await this.todoRepository.findBy({ user_id, todo_deleted: false });
  }

  async findOne(todo_id: number): Promise<Todo> {
    return await this.todoRepository.findOneBy({ todo_id, todo_deleted: false });
  }

  // CREATE
  async create(createTodoDto: CreateTodoDto): Promise<Todo> {
    const todo = new Todo();
    // todo_id, todo_deleted: default
    todo.user_id = createTodoDto.user_id;

    todo.todo_name = createTodoDto.todo_name;
    todo.todo_desc = createTodoDto.todo_desc;
    todo.todo_label = createTodoDto.todo_label;
    todo.todo_date = createTodoDto.todo_date;
    todo.todo_done = createTodoDto.todo_done;

    todo.todo_start = createTodoDto.todo_start;
    todo.todo_end = createTodoDto.todo_end;
    todo.grp_id = createTodoDto.grp_id;
    todo.todo_img = createTodoDto.todo_img;

    return await this.todoRepository.save(todo);
  }

  // UPDATE
  async update(todo_id: number, dto: UpdateTodoDto): Promise<Todo> {
    const todo = await this.todoRepository.findOneBy({ todo_id });
    todo.todo_name = dto.todo_name;
    todo.todo_desc = dto.todo_desc;
    todo.todo_date = dto.todo_date;
    todo.todo_done = dto.todo_done;

    todo.todo_start = dto.todo_start;
    todo.todo_end = dto.todo_end;
    todo.todo_img = dto.todo_img;
    todo.todo_label = dto.todo_label;

    return await this.todoRepository.save(todo);
  }

  // DELETE
  async delete(todo_id: number): Promise<void> {
    const todo = await this.todoRepository.findOneBy({ todo_id });
    todo.todo_deleted = true;
  }

  // todo 완료상태 변경
  async editDone(todo_id: number, dto: UpdateTodoDto): Promise<Todo> {
    const todo = await this.todoRepository.findOneBy({ todo_id });
    todo.todo_done = dto.todo_done;
    
    return this.todoRepository.save(todo);
  }
}
