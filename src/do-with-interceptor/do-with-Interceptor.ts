import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from "@nestjs/common";
import { Observable, map } from "rxjs";
import { DoWithExceptions } from "src/do-with-exception/do-with-exception";

enum HttpMethod {
  GET    = 'GET',
  PUT    = 'PUT',
  POST   = 'POST',
  PATCH  = 'PATCH',
  DELETE = 'DELETE'
}

@Injectable()
export class DoWithInterceptor implements NestInterceptor{
  constructor(
    private readonly doWithException: DoWithExceptions
  ){}

  intercept(context: ExecutionContext, next: CallHandler<any>): Observable<any> | Promise<Observable<any>> {
    return next.handle().pipe(
      map(data => {
        const http = context.switchToHttp(); 
        const req = http.getRequest();
        const res = http.getResponse();
        const method = req.method as HttpMethod;
        Logger.debug("#################");
        switch(method){
          case HttpMethod.GET:
            Logger.debug(HttpMethod.GET);
            // throw this.doWithException.NoData;
            break;
          case HttpMethod.PUT:
            Logger.debug(HttpMethod.PUT);
            break;
          case HttpMethod.POST:
            Logger.debug(HttpMethod.POST);
            break;
          case HttpMethod.PATCH:
            Logger.debug(HttpMethod.PATCH);
            // if(data.affected == 0){
            //   throw this.doWithException.FailedToUpdateData;
            // }
            break;
          case HttpMethod.DELETE:
            Logger.debug(HttpMethod.DELETE);
            // if(data.affected == 0){
            //   throw this.doWithException.FailedToDeleteData;
            // }
            break;
        }
        Logger.debug("#################");
        return data;
      })
    );
  } 
}