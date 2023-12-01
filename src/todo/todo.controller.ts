import {
  Get,
  Post,
  Patch,
  Put,
  Delete,
  Controller,
  Logger,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
  Request,
} from '@nestjs/common';
import { TodoService } from './todo.service';
import { CreateTodoDto } from './dto/create-todo.dto';
import { UpdateTodoDto } from './dto/update-todo.dto';
import { Todo } from './todo.entity';
import { AuthGuard } from '@nestjs/passport';

@Controller('todo')
export class TodoController {
  private logger = new Logger('Todos');
  constructor(private todoService: TodoService) {}

  @Get('/user/:user_id')
  findAllByUser(
    @Param('user_id', ParseIntPipe) user_id: number,
  ): Promise<Todo[]> {
    return this.todoService.findAllByUser(user_id);
  }

  @Post('/user/:user_id')
  createTodayTodo(@Param('user_id') user_id: number) {
    return this.todoService.createTodayTodo(user_id);
  }

  @Get('/:todo_id')
  findOne(@Param('todo_id', ParseIntPipe) todo_id: number): Promise<Todo> {
    return this.todoService.findOne(todo_id);
  }

  @Post()
  create(@Body() createTodoDto: CreateTodoDto): Promise<Todo> {
    return this.todoService.create(createTodoDto);
  }

  @Put('/:todo_id')
  update(
    @Param('todo_id', ParseIntPipe) todo_id: number,
    @Body() updateTodoDto: UpdateTodoDto,
  ): Promise<Todo> {
    return this.todoService.update(todo_id, updateTodoDto);
  }

  @Delete('/:todo_id')
  delete(@Param('todo_id', ParseIntPipe) todo_id: number): Promise<void> {
    return this.todoService.delete(todo_id);
  }

  @Patch('/:todo_id')
  @UseGuards(AuthGuard('jwt'))
  editDone(
    @Param('todo_id', ParseIntPipe) todo_id: number,
    @Body() updateTodoDto: UpdateTodoDto,
    @Request() req,
  ): Promise<Todo> {
    const user = req.user;
    Logger.log(user);
    return this.todoService.editDone(todo_id, updateTodoDto);
  }
}
