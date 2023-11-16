import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { DoWithMiddlewareMiddleware } from 'src/do-with-middleware/do-with-middleware.middleware';
import { DoWithExceptionFilterModule } from './do-with-exception-filter/do-with-exception-filter.module';
import { DoWithExceptionModule } from './do-with-exception/do-with-exception.module';

@Module({
  imports: [
    DoWithExceptionModule,
    DoWithExceptionFilterModule,
    ConfigModule.forRoot({
      isGlobal   : true,
      envFilePath: `./env/.${process.env.NODE_ENV}.env`
    })
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule{
  configure(consumer: MiddlewareConsumer): any {
      consumer.apply(DoWithMiddlewareMiddleware)
              .forRoutes('');
  }
}