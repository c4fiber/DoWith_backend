import { Body, Controller, Param, Patch, Get } from '@nestjs/common';
import { ItemInventoryService } from './item-inventory.service';

@Controller('item-inventory')
export class ItemInventoryController {
  constructor(
    private readonly itemInventoryService: ItemInventoryService
  ){}

  @Patch('/:user_id/pet-name/:item_id')
  renameMyPet(
    @Param('user_id') user_id: number,
    @Param('item_id') item_id: number,
    @Body('pet_name') pet_name: string
  ){
    return this.itemInventoryService.renameMyPet(user_id, item_id, pet_name);
  }

  @Get('/:user_id')
  findAllItemsInInventory(@Param('user_id') user_id: number){
    return this.itemInventoryService.findAll(user_id);
  }
}
