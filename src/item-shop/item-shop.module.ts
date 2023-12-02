import { Module } from '@nestjs/common';
import { ItemShopService } from './item-shop.service';
import { ItemShopController } from './item-shop.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ItemShop } from './entities/item-shop.entity';
import { ItemType } from 'src/item-type/entities/item-type.entity';
import { User } from 'src/user/user.entities';
import { DoWithExceptions } from 'src/do-with-exception/do-with-exception';
import { ItemInventory } from 'src/item-inventory/entities/item-inventory.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([ItemShop, ItemType, ItemInventory, User])
  ],
  controllers: [ItemShopController],
  providers: [ItemShopService, DoWithExceptions],
})
export class ItemShopModule {}
