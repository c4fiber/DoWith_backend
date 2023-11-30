import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Days } from './entities/days.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Days])]
})
export class DaysModule {}
