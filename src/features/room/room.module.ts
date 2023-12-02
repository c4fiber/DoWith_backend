import { Module } from '@nestjs/common';
import { RoomService } from './room.service';
import { RoomController } from './room.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Room } from '../entities/room.entity';
import { ItemInventory } from 'src/features/entities/item-inventory.entity';
import { DoWithExceptions } from 'src/utils/do-with-exception/do-with-exception';

@Module({
  imports: [TypeOrmModule.forFeature([Room, ItemInventory])],
  controllers: [RoomController],
  providers: [RoomService, DoWithExceptions],
})
export class RoomModule {}
