import { Controller, Get, Param, Post } from '@nestjs/common';
import { ItemShopService } from './item-shop.service';

@Controller('item-shop')
export class ItemShopController {
  constructor(private readonly itemShopService: ItemShopService) {}

  @Get('/:user_id/:type_id')
  getAllItems(
    @Param('user_id') user_id: number,
    @Param('type_id') type_id: number
  ){
    return this.itemShopService.getAllItems(user_id, type_id);
  }

  @Post('/:user_id/:item_id')
  buyItem(
    @Param('user_id') user_id: number,
    @Param('item_id') item_id: number
  ){
    return this.itemShopService.buyItem(user_id, item_id);
  }
}
