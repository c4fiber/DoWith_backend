import { Logger, MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { DoWithMiddlewareMiddleware } from 'src/utils/do-with-middleware.middleware';
import { AuthModule } from './auth/auth.module';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { DoWithExceptionFilter } from './utils/do-with-exception.filter';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { UtilsModule } from './utils/utils.module';
import { DoWithInterceptor } from './utils/do-with-Interceptor';
import { HttpModule } from '@nestjs/axios';
import { GatewayModule } from './gateway/gateway.module';
import { EntitiesModule } from './entities/entities.module';
import { FeatureModule } from './features/feature.module';

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
    AuthModule,      // login Auth 
    EntitiesModule,  // Entities
    FeatureModule,   // APIs
    GatewayModule, 
    UtilsModule,     // common
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