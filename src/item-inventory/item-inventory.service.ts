import { Injectable } from '@nestjs/common';
import { ItemInventory } from './entities/item-inventory.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class ItemInventoryService {
  constructor(
    @InjectRepository(ItemInventory)
    private readonly itemInventoryRepository: Repository<ItemInventory>,
  ) {}

  async renameMyPet(user_id: number, item_id: number, pet_name: string) {
    const result = await this.itemInventoryRepository
      .createQueryBuilder('iv')
      .update()
      .set({
        pet_name: pet_name,
        pet_exp: 0,
      })
      .where({ user_id })
      .andWhere({ item_id })
      .execute();

    return { result };
  }

  async findAll(user_id: number) {
    const result = await this.itemInventoryRepository
      .createQueryBuilder('iv')
      .where('iv.user_id = :user_id', { user_id })
      .leftJoin('item_shop', 'ish', 'iv.item_id = ish.item_id')
      .select([
        'ish.item_id as item_id',
        'ish.type_id as item_type',
        'ish.item_name as item_name',
        'ish.item_path as item_path',
        'iv.pet_name as pet_name',
        'iv.pet_exp as pet_exp',
      ])
      .getRawMany();
    return { result };
  }
}
