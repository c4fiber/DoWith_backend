import { ExceptionFilter, Catch, ArgumentsHost, HttpException, Logger, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';
import { DoWithException } from 'src/do-with-exception/do-with-exception';
import { doWithError } from 'src/error-log/entities/error.entity';
import { DataSource } from 'typeorm';

@Catch()
export class DoWithExceptionFilter implements ExceptionFilter {
  constructor(
    private readonly dataSource: DataSource
  ){}
  private readonly logger = new Logger();

  async catch(exception: DoWithException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();
    const err = new doWithError();
    let comRes = {
      timestamp: new Date().toISOString(),
      name     : exception.name,
      message  : exception.message,
      path     : req.url
    }

    this.logger.error(exception.stack);

    // 요구 사항에 따라서 밑에 코드 변경 예정
    if(exception.name === 'DoWithException'){
      err.err_code = exception.getErrCode();
      err.http_code = exception.getStatus();
      comRes['errCode'] = err.err_code;
    } 

    if(exception instanceof HttpException){
      err.http_code = exception.getStatus();
    } else {
      err.http_code = HttpStatus.INTERNAL_SERVER_ERROR;
    }

    res.status(err.http_code);

    try {
      const queryRunner = this.dataSource.createQueryRunner();
      
      err.method = req.method;
      err.url = req.url;
      err.agent = req.headers['user-agent'];
      err.ip = req.ip;
      err.parameters = req.body;
      err.err_name = exception.name;
      err.err_stack = exception.stack;

      await queryRunner.manager.save(doWithError, err);

    } catch(err){
      // 조치 없음
      this.logger.error('DB Insert Exception');
    }

    res.json(comRes);
  }
}