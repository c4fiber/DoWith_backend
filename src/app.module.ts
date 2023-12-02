import { Logger, MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TodoModule } from './features/todo/todo.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { DoWithMiddlewareMiddleware } from 'src/utils/do-with-middleware/do-with-middleware.middleware';
import { DoWithExceptionFilterModule } from './utils/do-with-exception-filter/do-with-exception-filter.module';
import { DoWithExceptionModule } from './utils/do-with-exception/do-with-exception.module';
import { UserModule } from './features/user/user.module';
import { AuthModule } from './auth/auth.module';
import { GroupModule } from './features/group/group.module';
import { RoutineModule } from './features/routine/routine.module';
import { CommentModule } from './features/comment/comment.module';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { DoWithExceptionFilter } from './utils/do-with-exception-filter/do-with-exception.filter';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { FriendModule } from './features/friend/friend.module';
import { CategoryModule } from './features/category/category.module';
import { UtilsModule } from './utils/utils.module';
import { DoWithInterceptorModule } from './utils/do-with-interceptor/do-with-interceptor.module';
import { DoWithInterceptor } from './utils/do-with-interceptor/do-with-Interceptor';
import { HttpModule } from '@nestjs/axios';
import { AchievementsModule } from './features/achievements/achievements.module';
import { ItemInventoryModule } from './features/item-inventory/item-inventory.module';
import { ItemShopModule } from './features/item-shop/item-shop.module';
import { RoomModule } from './features/room/room.module';
import { AppGateway } from './app.gateway';
import { EntitiesModule } from './features/entities/entities.module';

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
    // Fixed Table
    CategoryModule,
    ItemShopModule,
    AchievementsModule,
    // API Module
    TodoModule,
    GroupModule,
    RoutineModule,
    UserModule,
    AuthModule,
    FriendModule,
    CommentModule,
    ItemInventoryModule,
    RoomModule,
    EntitiesModule,
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
    AppGateway,
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
