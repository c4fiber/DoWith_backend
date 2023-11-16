import { Controller, Get, Post, Body, Patch, Param, Delete, Logger } from '@nestjs/common';
import { RoutineService } from './routine.service';
import { CreateRoutineDto } from './dto/create-routine.dto';

@Controller('routine')
export class RoutineController {
  constructor(
    private readonly routineService: RoutineService,
    private readonly logger: Logger
  ) {}

  @Post()
  create(@Body() createRoutineDto: CreateRoutineDto) {
    this.logger.log(JSON.stringify(createRoutineDto));

    return this.routineService.create(createRoutineDto);
  }
}