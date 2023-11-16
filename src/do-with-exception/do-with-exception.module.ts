import { Module } from '@nestjs/common';
import { DoWithExceptions } from './do-with-exception';

@Module({
    providers: [DoWithExceptions],
    exports: [DoWithExceptions]
})
export class DoWithExceptionModule {}