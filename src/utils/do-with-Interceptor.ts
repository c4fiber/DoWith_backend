import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from "@nestjs/common";
import { Observable, map } from "rxjs";
import { DoWithExceptions } from "src/utils/do-with-exception";
import { HttpMethod } from "src/enums/HttpMethod.enum";

@Injectable()
export class DoWithInterceptor implements NestInterceptor{
  constructor(
    private readonly doWithException: DoWithExceptions
  ){}

  intercept(context: ExecutionContext, next: CallHandler<any>): Observable<any> | Promise<Observable<any>> {
    return next.handle().pipe(
      map(data => {
        Logger.debug("############### [ Interceptor In ] ###############");

        const http = context.switchToHttp(); 
        const req = http.getRequest();
        const res = http.getResponse();
        const method = req.method as HttpMethod;
        const mainKey = 'result';
        
        switch(method){
          case HttpMethod.GET:
            if(mainKey in data){           // result: single row data
              Object.keys(data[mainKey]).forEach((key, val) => {
                if(data[mainKey][key] === undefined){
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
            if(data[mainKey]['affected'] == 0){
              //throw this.doWithException.FailedToUpdateData;
            }
            break;
          case HttpMethod.DELETE:
            if(data[mainKey]['affected'] == 0){
              //throw this.doWithException.FailedToDeleteData;
            }
            break;
        }

        Logger.debug(`data = ${data}`);
        Logger.debug("############### [ Interceptor Out ] ###############");
        return data;
      })
    );
  } 
}