import { Module } from '@nestjs/common';
import { DoWithExceptions } from 'src/do-with-exception/do-with-exception';

@Module({
  providers: [ DoWithExceptions ]
})
export class DoWithInterceptorModule {}
