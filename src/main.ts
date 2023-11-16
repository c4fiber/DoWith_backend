import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as winston from 'winston'
import {
  utilities as nestWinstonModuleUtilities,
  WinstonModule
} from 'nest-winston';
import { Logger } from '@nestjs/common';
import { DoWithExceptionFilter } from './do-with-exception-filter/do-with-exception.filter';

async function bootstrap() {
  const port = process.env.PORT;
  const app = await NestFactory.create(
    AppModule,
    {
      logger: WinstonModule.createLogger({
        transports: [
          new winston.transports.Console({
            level : process.env.LOG_LEVEL,
            format: winston.format.combine(
              winston.format.timestamp(),
              nestWinstonModuleUtilities.format.nestLike('DoWith', {
                colors     : true,
                prettyPrint: true
              })
            ),
          }),          
        ],
      })
    }
  );

  app.useGlobalFilters(new DoWithExceptionFilter(new Logger()));

  await app.listen(+port);
  Logger.log(`Application running on port ${port}`);
}
bootstrap();
