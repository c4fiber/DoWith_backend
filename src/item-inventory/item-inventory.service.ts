import { Injectable, Logger } from '@nestjs/common';
import { ItemInventory } from './entities/item-inventory.entity';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { DoWithExceptions } from 'src/do-with-exception/do-with-exception';
import { ItemShop } from 'src/item-shop/entities/item-shop.entity';

@Injectable()
export class ItemInventoryService {
  constructor(
    @InjectRepository(ItemInventory)
    private readonly itemInventoryRepository: Repository<ItemInventory>,
    @InjectRepository(ItemShop)
    private readonly itemShopRespository: Repository<ItemShop>,
    private readonly doWithExceptions: DoWithExceptions,
    private readonly dataSource: DataSource,
  ) {}

  EVOLUTION_THRESHOLD: string = '03';

  async evolveMyPet(user_id: number, item_id: number): Promise<{ result }> {
    const { pet_name, pet_item_name } = await this.itemInventoryRepository
      .createQueryBuilder('iv')
      .where('iv.user_id = :user_id', { user_id })
      .andWhere('iv.item_id = :item_id', { item_id })
      .leftJoin('item_shop', 'ish', 'iv.item_id = ish.item_id')
      .select(['iv.pet_name as pet_name', 'ish.item_name as pet_item_name'])
      .getRawOne();

    // Logger.log(`??? ${rtn}`);

    const [pet_type, pet_level] = pet_item_name.split('_');

    if (pet_level == this.EVOLUTION_THRESHOLD) {
      // 펫이 이미 진화를 완료함
      throw this.doWithExceptions.PetEvolFinished;
    }

    const next_pet_name = `${pet_type}_0${parseInt(pet_level) + 1}`;
    const next_pet = await this.itemShopRespository.findOneBy({
      item_name: next_pet_name,
    });

    if (next_pet == null) {
      throw this.doWithExceptions.NoData;
    }

    const result = await this.itemInventoryRepository
      .createQueryBuilder()
      .insert()
      .into(ItemInventory)
      .values([
        {
          user_id: user_id,
          item_id: next_pet.item_id,
          pet_name: pet_name,
          pet_exp: 0,
        },
      ])
      .execute();

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
