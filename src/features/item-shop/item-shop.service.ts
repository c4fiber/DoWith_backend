import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ItemShop } from '../../entities/item-shop.entity';
import { DataSource, Repository } from 'typeorm';
import { ItemType } from 'src/entities/item-type.entity';
import { User } from 'src/entities/user.entities';
import { DoWithExceptions } from 'src/utils/do-with-exception';
import { ItemInventory } from 'src/entities/item-inventory.entity';

@Injectable()
export class ItemShopService {
  constructor(
    @InjectRepository(ItemShop)
    private readonly itemShopRepo: Repository<ItemShop>,
    @InjectRepository(ItemType)
    private readonly itemTypeRepo: Repository<ItemType>,
    @InjectRepository(ItemInventory)
    private readonly itemInvenRepo: Repository<ItemInventory>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly dwExcept: DoWithExceptions,
    private readonly dataSource: DataSource
  ){}

  /**
   * 상점의 모든 아이템 목록 조회(보유 아이템 제외)
   * @description 클라이언트 상점 탭에 따라서 아이템 종류가 다르기 때문에
   *              요구 사항에 맞춰서 데이터 반환
   * @param user_id 
   * @returns 
   */
  async getAllItems(user_id: number, type_id: number){
    // 유저가 소유한 아이템 번호 목록
    const ItemsIds = await this.itemShopRepo.createQueryBuilder('ish')
                                            .select(['ish.item_id AS item_id'])
                                            .leftJoin('item_inventory', 'iv', 'ish.item_id = iv.item_id')
                                            .where('iv.user_id = :user_id', { user_id })
                                            .getRawMany();
    const ownItems = ItemsIds.map(data => data.item_id);
    // 현재 프로덕트가 가진 아이템 타입 정보
    const types = await this.itemTypeRepo.createQueryBuilder('t')
                                         .select([
                                           't.type_id   AS type_id'
                                         , 't.type_name AS type_name'
                                         ])
                                         .getRawMany();
    // 상점 아이템 조회                    
    const query = this.itemShopRepo.createQueryBuilder('ish')
                                   .select([
                                     'ish.item_id    AS item_id'
                                   , 'ish.item_name AS item_name'
                                   , 'ish.item_cost AS item_cost'
                                   , 'ish.item_path AS item_path'
                                   ])
                                   .leftJoin('item_inventory', 'iv', 'iv.user_id = :user_id AND ish.item_id = iv.item_id', { user_id })
                                   .leftJoin('item_type'     , 'it', 'ish.type_id = it.type_id')
                                   .where('it.type_id = :type_id', { type_id });

    if(ownItems.length > 0){
      query.andWhere('ish.item_id NOT IN (:...ownItems)', { ownItems });
    }

    return { result: await query.getRawMany(), path: process.env.PUBLIC_IMAGE_PATH };
  }

  /**
   * 유저가 상점에서 아이템 구매
   * @description 1. 아이템 가격 만큼 유저 캐시 차감
   *              2. 유저 인벤토리에 구입한 아이템 추가
   * @param user_id 
   * @param item_id 
   * @returns 
   */
  async buyItem(user_id: number, item_id: number){
    const qr = this.dataSource.createQueryRunner();
    // 아이템 가격
    const item_cost = await this.itemShopRepo.createQueryBuilder('ish')
                                             .select(['ish.item_cost AS item_cost'])
                                             .where('ish.item_id = :item_id', { item_id })
                                             .getRawOne();
                                                   
    try {
      await qr.connect();
      await qr.startTransaction();

      // 1. 유저 캐시 차감 금액이 부족하다면 데이터 변화 없음
      const result = await this.userRepo.createQueryBuilder('u')
                                        .update()
                                        .set({ user_cash: () => `user_cash - ${item_cost.item_cost}` })
                                        .where({ user_id })
                                        .andWhere(`user_cash - ${item_cost.item_cost} >= 0`)
                                        .execute();
      if(result.affected === 0){
        throw this.dwExcept.NotEnoughCash;
      }
      // 2. 유저 인벤토리에 구입한 아이템 추가
      await this.itemInvenRepo.createQueryBuilder('iv')
                              .insert()
                              .values({
                                user_id: user_id
                              , item_id: item_id
                              })
                              .execute();
                                      
      await qr.commitTransaction();
      return { result };
    } catch(err) {
      await qr.rollbackTransaction();
      throw new Error(err);
    } finally {
      await qr.release();
    }
  }
}