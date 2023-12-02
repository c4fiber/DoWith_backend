import { Module } from '@nestjs/common';
import { ItemShopService } from './item-shop.service';
import { ItemShopController } from './item-shop.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ItemShop } from '../../entities/item-shop.entity';
import { ItemType } from 'src/entities/item-type.entity';
import { User } from 'src/entities/user.entities';
import { DoWithExceptions } from 'src/utils/do-with-exception/do-with-exception';
import { ItemInventory } from 'src/entities/item-inventory.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([ItemShop, ItemType, ItemInventory, User])
  ],
  controllers: [ItemShopController],
  providers: [ItemShopService, DoWithExceptions],
})
export class ItemShopModule {}
