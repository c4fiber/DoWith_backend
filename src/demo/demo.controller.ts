import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe } from '@nestjs/common';
import { DemoService } from './demo.service';
import { CreateDemoDto } from './dto/create-demo.dto';
import { UpdateDemoDto } from './dto/update-demo.dto';

@Controller('demo')
export class DemoController {
  constructor(private readonly demoService: DemoService) {}

  @Post('/:user_id')
  async doDemo(
    @Param('user_id', ParseIntPipe) userId: number,
    @Body() dto: CreateDemoDto,
  ) {
    return this.demoService.run(userId, dto);
  }
}
