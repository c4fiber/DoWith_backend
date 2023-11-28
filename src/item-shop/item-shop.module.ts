import { Module } from '@nestjs/common';
import { ItemShopService } from './item-shop.service';
import { ItemShopController } from './item-shop.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ItemShop } from './entities/item-shop.entity';
import { ItemType } from 'src/item-type/entities/item-type.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([ItemShop, ItemType])
  ],
  controllers: [ItemShopController],
  providers: [ItemShopService],
})
export class ItemShopModule {}
