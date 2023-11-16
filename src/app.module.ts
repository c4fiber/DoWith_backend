import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TodoModule } from './todo/todo.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { DoWithMiddlewareMiddleware } from 'src/do-with-middleware/do-with-middleware.middleware';
import { DoWithExceptionFilterModule } from './do-with-exception-filter/do-with-exception-filter.module';
import { DoWithExceptionModule } from './do-with-exception/do-with-exception.module';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';

// timezone check
const now = new Date();
const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
console.log(timeZone); // 현재 타임존 출력
console.log(new Date().toISOString());

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `./env/.${process.env.NODE_ENV}.env`,
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: +process.env.DB_PORT,
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
      autoLoadEntities: true,
      synchronize: true,
      extra: {
        timezone: 'Asia/Seoul',
      },
    }),
    // Common Module
    DoWithExceptionModule,
    DoWithExceptionFilterModule,
    // API Module
    TodoModule,
    UserModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): any {
    consumer.apply(DoWithMiddlewareMiddleware).forRoutes('');
  }
}
