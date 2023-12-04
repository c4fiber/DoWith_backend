import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { MulterConfig } from './MulterConfigService';
import { DoWithExceptions } from './do-with-exception';
import { DoWithInterceptor } from './do-with-Interceptor';
import { DoWithMiddlewareMiddleware } from './do-with-middleware.middleware';

@Module({
  imports: [
    MulterModule.registerAsync({
      useClass: MulterConfig
    })
  ],
  providers: [
        DoWithExceptions
      , DoWithInterceptor
      , DoWithMiddlewareMiddleware
  ],
  exports: [ 
      MulterModule
    , DoWithExceptions
    , DoWithInterceptor
  ]
})
export class UtilsModule {}
