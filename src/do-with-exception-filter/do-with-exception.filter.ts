import { ExceptionFilter, Catch, ArgumentsHost, HttpException, Logger } from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class DoWithExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger();

  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();
    let comRes = {
      timestamp: new Date().toISOString(),
      name     : exception.name,
      message  : exception.message,
      path     : req.url
    }

    this.logger.debug(req.method);
    this.logger.debug(req.url);
    this.logger.debug(req.headers['user-agent']);
    this.logger.error(exception.stack);

    // 요구 사항에 따라서 밑에 코드 변경 예정
    if(exception.name === 'DoWithException' || exception.name === 'HTTPException'){
      res.status(exception.getStatus());
    } 

    res.json(comRes);
  }
}