import {
  Body,
  Controller,
  Param,
  Patch,
  Get,
  Post,
  UseGuards,
  Request,
  ParseIntPipe,
} from '@nestjs/common';
import { ItemInventoryService } from './item-inventory.service';
import { AuthGuard } from '@nestjs/passport';
import { User } from 'src/entities/user.entities';

@Controller('item-inventory')
export class ItemInventoryController {
  constructor(private readonly itemInventoryService: ItemInventoryService) {}

  @Get('/:user_id/pet')
  getMyMainPet(@Param('user_id', ParseIntPipe) user_id: number) {
    return this.itemInventoryService.getMyMainPet(user_id);
  }

  @Post('/:user_id/pet/:item_id')
  // @UseGuards(AuthGuard('jwt'))
  evolveMyPet(
    @Param('user_id', ParseIntPipe) user_id: number,
    @Param('item_id', ParseIntPipe) item_id: number,
    @Request() req,
  ) {
    // const user: User = req.user;
    return this.itemInventoryService.evolveMyPet(user_id, item_id);
  }

  @Patch('/:user_id/pet-name/:item_id')
  renameMyPet(
    @Param('user_id') user_id: number,
    @Param('item_id') item_id: number,
    @Body('pet_name') pet_name: string,
  ) {
    return this.itemInventoryService.renameMyPet(user_id, item_id, pet_name);
  }

  @Get('/:user_id')
  findAllItemsInInventory(@Param('user_id') user_id: number) {
    return this.itemInventoryService.findAll(user_id);
  }
}