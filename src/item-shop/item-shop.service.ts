import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ItemShop } from './entities/item-shop.entity';
import { DataSource, Repository } from 'typeorm';
import { ItemType } from 'src/item-type/entities/item-type.entity';

@Injectable()
export class ItemShopService {
  constructor(
    @InjectRepository(ItemShop)
    private readonly itemShopRepository: Repository<ItemShop>,
    @InjectRepository(ItemType)
    private readonly itemTypeRepository: Repository<ItemType>,
    private readonly dataSource: DataSource
  ){}

  async getAllItems(user_id: number, pagingOptions: { page: number; limit: number }){
    const { page, limit } = pagingOptions;
    // 유저가 소유한 아이템 번호 목록
    const ItemsIds = await this.itemShopRepository.createQueryBuilder('ish')
                                                  .leftJoin('item_inventory', 'iv', 'ish.item_id = iv.item_id')
                                                  .select(['ish.item_id AS item_id'])
                                                  .where('iv.user_id = :user_id', { user_id })
                                                  .getRawMany();
    const ownItems = ItemsIds.map(data => data.item_id);
    // 현재 프로덕트가 가진 아이템 타입 정보
    const types = await this.itemTypeRepository.createQueryBuilder('t')
                                               .select([
                                                  't.type_id   AS type_id'
                                               ,  't.type_name   AS type_name'
                                               ])
                                               .getRawMany();
    // 상점 아이템 조회                    
    const query = await this.itemShopRepository.createQueryBuilder('ish')
                                               .leftJoin('item_inventory', 'iv', 'iv.user_id = :user_id AND ish.item_id = iv.item_id', { user_id })
                                               .leftJoin('item_type'     , 'it', 'ish.type_id = it.type_id')
                                               .select([
                                                 'ish.item_id    AS item_id'
                                               , 'ish.item_name AS item_name'
                                               , 'ish.item_cost AS item_cost'
                                               , 'ish.item_path AS item_path'
                                               ])
                                               .where('ish.item_id NOT IN (:...ownItems)', { ownItems })
    
    let results = {};                                           
    for(const type of types){
      const type_id = type.type_id;
      const type_name = type.type_name;

      results[`${type_name}`] = await query.andWhere('it.type_id = :type_id', { type_id })
                                           .getRawMany();
    }

    return { results };
  }

  async buyItem(user_id: number, item_id: number){
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      

      return;
    } catch(err) {

    }
  }
}