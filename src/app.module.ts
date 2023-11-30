import { Logger, MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
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
import { GroupModule } from './group/group.module';
import { RoutineModule } from './routine/routine.module';
import { CommentModule } from './comment/comment.module';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { DoWithExceptionFilter } from './do-with-exception-filter/do-with-exception.filter';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { FriendModule } from './friend/friend.module';
import { CategoryModule } from './category/category.module';
import { UserGroupModule } from './user_group/user_group.module';
import { UtilsModule } from './utils/utils.module';
import { DoWithInterceptorModule } from './do-with-interceptor/do-with-interceptor.module';
import { DoWithInterceptor } from './do-with-interceptor/do-with-Interceptor';
import { ErrorLogModule } from './error-log/error-log.module';
import { HttpModule } from '@nestjs/axios';
import { DaysModule } from './days/days.module';
import { AchievementsModule } from './achievements/achievements.module';
import { UserAchiModule } from './user_achi/user_achi.module';
import { ItemInventoryModule } from './item-inventory/item-inventory.module';
import { ItemShopModule } from './item-shop/item-shop.module';
import { ItemTypeModule } from './item-type/item-type.module';
import { RoomModule } from './room/room.module';

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
      synchronize: true, // 배포할 때는 false 안하면 변경시 데이터 날아갈 수 있음
      logging: true,
      extra: {
        timezone: 'Asia/Seoul',
      },
    }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'public'),
    }),
    // Common Module
    DoWithExceptionModule,
    DoWithExceptionFilterModule,
    DoWithInterceptorModule,
    UtilsModule,

    // API Module
    TodoModule,
    GroupModule,
    RoutineModule,
    UserModule,
    AuthModule,
    FriendModule,
    CategoryModule,
    UserGroupModule,
    CommentModule,
    ErrorLogModule,
    DaysModule,
    AchievementsModule,
    UserAchiModule,
    ItemShopModule,
    ItemInventoryModule,
    ItemTypeModule,
    RoomModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    Logger,
    {
      provide: APP_FILTER,
      useClass: DoWithExceptionFilter,
    },
    // {
    //   provide: APP_INTERCEPTOR,
    //   useClass: DoWithInterceptor,
    // },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): any {
    consumer.apply(DoWithMiddlewareMiddleware).forRoutes('');
  }
}

// timezone check
const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
console.log(timeZone); // 현재 타임존 출력

function getNow() {
  const event = new Date();
  event.setTime(event.getTime() - event.getTimezoneOffset() * 60 * 1000);
  return event.toISOString();
}

console.log(getNow()); // 현재 타임존의 시간 출력
