import { Injectable, NestMiddleware } from '@nestjs/common';

@Injectable()
export class DoWithMiddlewareMiddleware implements NestMiddleware {
  use(req: any, res: any, next: () => void) {
    const logHeader    = `================== [${req.method}] ${req.url} ==================`;
    const logDate      = `date     : ${new Date()}`;
    const logAgent     = `agent    : ${req.headers['user-agent']}`;
    const logClientIp  = `client Ip: ${req.ip}`;
    const logProxyIps  = `proxy Ips: ${req.ips}`;
    const reqBody = {...req.body};

    const keys = Object.keys(reqBody);
    var params = "";

    if(keys.length !== 0){
      params = "================== [ Parameters ] ==================\n";

      keys.forEach((key) => {
        const value = reqBody[key];
        params += `${key} = ${value}\n`;
      });
    }

    console.log(`
${logHeader}
${logDate}
${logAgent}
${logClientIp}
${logProxyIps}
${params}`);
    
    next();
  }
}
