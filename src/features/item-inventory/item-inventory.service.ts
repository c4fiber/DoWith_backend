import { Injectable } from '@nestjs/common';
import { ItemInventory } from '../../entities/item-inventory.entity';
import { DataSource, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { DoWithExceptions } from 'src/utils/do-with-exception';
import { ItemShop } from 'src/entities/item-shop.entity';
import { Room } from 'src/entities/room.entity';

@Injectable()
export class ItemInventoryService {
  constructor(
    @InjectRepository(ItemInventory)
    private readonly itemInventoryRepository: Repository<ItemInventory>,
    @InjectRepository(ItemShop)
    private readonly itemShopRespository: Repository<ItemShop>,
    private readonly dwExcept: DoWithExceptions,
    private readonly dataSource: DataSource,
  ) {}


  async getMyMainPet(user_id: number) {
    const result = await this.dataSource
      .getRepository(Room)
      .createQueryBuilder('r')
      .leftJoin('item_shop', 'ish', 'r.item_id = ish.item_id')
      .leftJoin('item_inventory', 'iv', 'r.item_id = iv.item_id')
      .where('r.user_id = :user_id', { user_id: user_id })
      .select([
        'ish.item_id as item_id',
        'ish.type_id as item_type',
        'ish.item_name as item_name',
        'ish.item_path as item_path',
        'iv.pet_name as pet_name',
        'iv.pet_exp as pet_exp',
      ])
      .getRawOne();

    if (result == null) {
      throw this.dwExcept.NoData;
    }

    return { result };
  }

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

  async findAll(user_id: number, type_id: number) {
    const result = await this.itemInventoryRepository.createQueryBuilder('iv')
                                                     .select([
                                                       'ish.item_id as item_id'
                                                     , 'ish.type_id as item_type'
                                                     , 'ish.item_name as item_name'
                                                     , 'ish.item_path as item_path'
                                                     , 'iv.pet_name as pet_name'
                                                     , 'iv.pet_exp as pet_exp'
                                                     , 'ish.metadata as metadata'
                                                     ])
                                                     .leftJoin('item_shop', 'ish', 'iv.item_id = ish.item_id')
                                                     .where('iv.user_id = :user_id', { user_id })
                                                     .andWhere('ish.type_id = :type_id', { type_id })
                                                     .getRawMany();
    return { result };
  }
}
