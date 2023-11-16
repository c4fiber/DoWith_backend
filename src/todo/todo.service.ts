import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm'
import { Todo } from './todo.entity'
import { CreateTodoDto } from './dto/create-todo.dto'

@Injectable()
export class TodoService {
    constructor(
        @InjectRepository(Todo)
        private readonly todoRepository: Repository<Todo>,
    ) {}

    // READ
    async findAll(user_id: number): Promise <Todo[]> {
        return await this.todoRepository.findBy({ user_id });
    }

    // CREATE
    async create(createTodoDto: CreateTodoDto): Promise <Todo> {
        const todo = new Todo();
        todo.user_id = createTodoDto.user_id;
        todo.todo_name = createTodoDto.todo_name;
        todo.todo_desc = createTodoDto.todo_desc;
        todo.todo_date = createTodoDto.todo_date;
        todo.todo_done = createTodoDto.todo_done;
        todo.todo_start = createTodoDto.todo_start;
        todo.todo_end = createTodoDto.todo_end;
        todo.grp_id = createTodoDto.grp_id;
        todo.todo_img = createTodoDto.todo_img;

        return await this.todoRepository.save(todo);
    }

    // UPDATE
    async update(todo_id: number, createTodoDto: CreateTodoDto): Promise <Todo> {
        const todo = await this.todoRepository.findOneBy({ todo_id });
        todo.user_id = createTodoDto.user_id;
        todo.todo_name = createTodoDto.todo_name;
        todo.todo_desc = createTodoDto.todo_desc;
        todo.todo_date = createTodoDto.todo_date;
        todo.todo_done = createTodoDto.todo_done;
        todo.todo_start = createTodoDto.todo_start;
        todo.todo_end = createTodoDto.todo_end;
        todo.grp_id = createTodoDto.grp_id;
        todo.todo_img = createTodoDto.todo_img;

        return await this.todoRepository.save(todo);
    }

    // DELETE
    async delete(todo_id: number): Promise <void> {
        await await this.todoRepository.delete({ todo_id });
    }

}
