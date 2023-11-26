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
        
        switch(method){
          case HttpMethod.GET:
            if('result' in data){           // result: single row data
              Object.keys(data['result']).forEach((key, val) => {
                if(data['result'][key] === undefined){
                  throw this.doWithException.NoData;
                }
              });
            } else if('results' in data) {  // results: mulit row data
              if(data.results.length === 0){
                throw this.doWithException.NoData;
              }
            }
            break;
          case HttpMethod.PUT:
            Logger.debug(HttpMethod.PUT);
            break;
          case HttpMethod.POST:
            Logger.debug(HttpMethod.POST);
            break;
          case HttpMethod.PATCH:
            if(data['result']['affected'] == 0){
              throw this.doWithException.FailedToUpdateData;
            }
            break;
          case HttpMethod.DELETE:
            Logger.debug(HttpMethod.DELETE);
            
            if(data['result']['affected'] == 0){
              throw this.doWithException.FailedToDeleteData;
            }
            break;
        }

        return data;
      })
    );
  } 
}