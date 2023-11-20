import { Controller, Get, Post, Body, Patch, Param, Delete, Logger } from '@nestjs/common';
import { RoutineService } from './routine.service';
import { CreateRoutineDto } from './dto/create-routine.dto';

@Controller('routine')
export class RoutineController {
  constructor(
    private readonly routineService: RoutineService,
    private readonly logger: Logger
  ) {}

  @Get('/:group_id')
  getAllRoutines(@Param('group_id') group_id: number){
    return this.routineService.getAllRoutines(group_id);
  }

  @Post()
  createRoutine(@Body() createRoutineDto: CreateRoutineDto) {
    this.logger.debug(JSON.stringify(createRoutineDto));

    return this.routineService.createRoutine(createRoutineDto);
  }
}