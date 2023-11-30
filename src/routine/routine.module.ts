import { Module } from '@nestjs/common';
import { RoutineService } from './routine.service';
import { RoutineController } from './routine.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Routine } from './entities/routine.entity';
import { DoWithExceptions } from 'src/do-with-exception/do-with-exception';

@Module({
  imports: [TypeOrmModule.forFeature([Routine])],
  controllers: [RoutineController],
  providers: [ RoutineService, DoWithExceptions ],
})
export class RoutineModule {}
