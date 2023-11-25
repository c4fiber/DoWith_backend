import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from "@nestjs/common";
import { Observable, map } from "rxjs";

@Injectable()
export class DoWithInterceptor implements NestInterceptor{
  intercept(context: ExecutionContext, next: CallHandler<any>): Observable<any> | Promise<Observable<any>> {
    return next.handle().pipe(
      map(data => {
        const http = context.switchToHttp(); 
        const req = http.getRequest()
        const res = http.getResponse();

        return;
      })
    )
  } 
}