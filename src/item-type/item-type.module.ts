import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ItemType } from './entities/item-type.entity';

@Module({imports: [
  TypeOrmModule.forFeature([ItemType])
  ],
})
export class ItemTypeModule {}
