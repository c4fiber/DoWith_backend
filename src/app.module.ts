import { Logger, MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { TodoModule } from './features/todo/todo.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { DoWithMiddlewareMiddleware } from 'src/utils/do-with-middleware.middleware';
import { UserModule } from './features/user/user.module';
import { AuthModule } from './auth/auth.module';
import { GroupModule } from './features/group/group.module';
import { RoutineModule } from './features/routine/routine.module';
import { CommentModule } from './features/comment/comment.module';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { DoWithExceptionFilter } from './utils/do-with-exception.filter';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { FriendModule } from './features/friend/friend.module';
import { CategoryModule } from './features/category/category.module';
import { UtilsModule } from './utils/utils.module';
import { DoWithInterceptor } from './utils/do-with-Interceptor';
import { HttpModule } from '@nestjs/axios';
import { NotificationModule } from './features/notification/notification.module';
import { GatewayModule } from './gateway/gateway.module';
import { AchievementsModule } from './features/achievements/achievements.module';
import { ItemInventoryModule } from './features/item-inventory/item-inventory.module';
import { ItemShopModule } from './features/item-shop/item-shop.module';
import { RoomModule } from './features/room/room.module';
import { EntitiesModule } from './entities/entities.module';
import { AnnouncementModule } from './features/announcement/announcement.module';
import { AttendanceModule } from './features/attendance/attendance.module';
import { DemoModule } from './demo/demo.module';
import * as fs from 'fs';

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
      ssl: {
        ca: fs.readFileSync('global-bundle.pem')
      },
      extra: {
        max: 30,
        timezone: 'Asia/Seoul',
      },
    }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'public'),
    }),
    // Common Module
    UtilsModule,
    // Fixed Table
    CategoryModule,
    ItemShopModule,
    AchievementsModule,
    // API Module
    UserModule,
    TodoModule,
    GroupModule,
    RoutineModule,
    AuthModule,
    NotificationModule,
    FriendModule,
    CommentModule,
    ItemInventoryModule,
    RoomModule,
    GatewayModule,
    EntitiesModule,
    NotificationModule,
    AnnouncementModule,
    AttendanceModule,
    DemoModule,
  ],
  controllers: [],
  providers: [
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