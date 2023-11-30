import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { doWithError } from './entities/error.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([doWithError])
  ]
})
export class ErrorLogModule {}
