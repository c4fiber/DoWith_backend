import {Get, Post, Patch, Put, Delete, Controller, Logger, Body, Param, ParseIntPipe } from '@nestjs/common';
import { TodoService } from './todo.service';
import { CreateTodoDto } from './dto/create-todo.dto';
import { Todo } from './todo.entity';

@Controller('todo')
export class TodoController {
    private logger = new Logger('Todos');
    constructor(private todoService: TodoService) {}

    @Get('/:user_id')
    findAll(@Param('user_id', ParseIntPipe) user_id: number): Promise<Todo[]> {
        return this.todoService.findAll(user_id);
    }

    @Post()
    create(@Body() createTodoDto: CreateTodoDto): Promise<Todo> {
        return this.todoService.create(createTodoDto);
    }

    @Put('/:todo_id')
    update(@Param('todo_id', ParseIntPipe) todo_id: number, @Body() createTodoDto: CreateTodoDto): Promise<Todo> {
        return this.todoService.update(todo_id, createTodoDto);
    }

    @Delete('/:todo_id')
    delete(@Param('todo_id', ParseIntPipe) todo_id: number): Promise<void> {
        return this.todoService.delete(todo_id);
    }

}
