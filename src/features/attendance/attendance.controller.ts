import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { AttendanceService } from './attendance.service';

@Controller('attendance')
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Get('/:user_id')
  getAllAttendances(
    @Param('user_id') user_id: number
  ) {
    return this.attendanceService.getAllAttendances(user_id);
  }
}
