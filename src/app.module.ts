import { Logger, MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TodoModule } from './todo/todo.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { DoWithMiddlewareMiddleware } from 'src/do-with-middleware/do-with-middleware.middleware';
import { DoWithExceptionFilterModule } from './do-with-exception-filter/do-with-exception-filter.module';
import { DoWithExceptionModule } from './do-with-exception/do-with-exception.module';
import { GroupModule } from './group/group.module';
import { RoutineModule } from './routine/routine.module';
import { APP_FILTER } from '@nestjs/core';
import { DoWithExceptionFilter } from './do-with-exception-filter/do-with-exception.filter';

// timezone check
const now = new Date();
const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
console.log(timeZone); // 현재 타임존 출력
console.log(new Date().toISOString());

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal   : true,
      envFilePath: `./env/.${process.env.NODE_ENV}.env`
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: +process.env.DB_PORT,
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
      autoLoadEntities: true,
      synchronize: true,  // 배포할 때는 false 안하면 변경시 데이터 날아갈 수 있음
      logging: true,
      extra: {
        timezone: 'Asia/Seoul'
      }
    }),
    // API Module
    TodoModule,
    GroupModule,
    RoutineModule,
    // Common Module
    DoWithExceptionModule,
    DoWithExceptionFilterModule
  ],
  controllers: [AppController],
  providers: [
    AppService,
    Logger,
    {
      provide: APP_FILTER,
      useClass: DoWithExceptionFilter
    }
  ],
})
export class AppModule implements NestModule{
  configure(consumer: MiddlewareConsumer): any {
      consumer.apply(DoWithMiddlewareMiddleware)
              .forRoutes('');
  }
}