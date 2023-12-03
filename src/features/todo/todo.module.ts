import { Module } from '@nestjs/common';
import { TodoController } from './todo.controller';
import { TodoService } from './todo.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Todo } from '../../entities/todo.entity';
import { DoWithExceptions } from 'src/utils/do-with-exception/do-with-exception';

@Module({
  imports: [TypeOrmModule.forFeature([Todo])],
  controllers: [TodoController],
  providers: [TodoService, DoWithExceptions]
})
export class TodoModule {}
