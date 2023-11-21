import { Controller, Get, Post, Body, Patch, Param, Delete, Logger } from '@nestjs/common';
import { RoutineService } from './routine.service';
import { CreateRoutineDto } from './dto/create-routine.dto';

@Controller('routine')
export class RoutineController {
  constructor(
    private readonly routineService: RoutineService,
    private readonly logger: Logger
  ) {}

  @Get('/:grp_id')
  getAllRoutines(@Param('grp_id') grp_id: number): Promise<any>{
    return this.routineService.getAllRoutines(grp_id);
  }

  @Post('/:grp_id')
  createRoutine(
    @Param('grp_id')grp_id: number,
    @Body() createRoutineDto: CreateRoutineDto
  ): Promise<any> {
    this.logger.debug(JSON.stringify(createRoutineDto));

    return this.routineService.createRoutine(grp_id, createRoutineDto);
  }

  @Delete('/:rout_id')
  deleteRoutine(@Param('rout_id')rout_id: number): Promise<any> {
    return this.routineService.deleteRoutine(rout_id);  
  }
}