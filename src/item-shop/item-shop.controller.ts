import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ItemShopService } from './item-shop.service';

@Controller('item-shop')
export class ItemShopController {
  constructor(private readonly itemShopService: ItemShopService) {}
}
