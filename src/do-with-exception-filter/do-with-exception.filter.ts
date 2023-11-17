import { ExceptionFilter, Catch, ArgumentsHost, HttpException, Logger, Injectable } from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class DoWithExceptionFilter implements ExceptionFilter {
   constructor(
    private readonly logger = Logger
   ) {}

  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();
    // let status = exception.getStatus();

    // 요구 사항에 따라서 밑에 코드 변경 예정
    if(exception.name === 'DoWithException'){
      this.logger.error("DoWithException");
    } else if(exception.name === 'HTTPException'){
      this.logger.error("HTTPException");
    } else{
      this.logger.error("여기 에러 났습니다 동네 사람들!!!", exception);
      this.logger.debug(req.method)
      this.logger.debug(req.url)
      this.logger.debug(req.headers['user-agent'])
    }

    // response.status(status)
    res.json({
      //statusCode: status,
      timestamp : new Date().toISOString(),
      path      : req.url
    });
  }
}