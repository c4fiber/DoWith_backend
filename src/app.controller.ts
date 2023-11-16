import { BadRequestException, Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { DoWithExceptions } from './do-with-exception/do-with-exception';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly doWithException: DoWithExceptions
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('/error')
  errorTest() {
    throw new BadRequestException('Test');
  }

  @Get('/customError')
  customErrorTest(){
    throw this.doWithException.NotPermitted;
  }
}
