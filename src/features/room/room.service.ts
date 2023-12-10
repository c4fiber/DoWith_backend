import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Room } from '../../entities/room.entity';
import { DataSource } from 'typeorm';
import { ItemInventory } from 'src/entities/item-inventory.entity';
import { DoWithExceptions } from 'src/utils/do-with-exception';

@Injectable()
export class RoomService {
  constructor(
    @InjectRepository(ItemInventory)
    private readonly itemInventoryRepo: Repository<ItemInventory>,
    @InjectRepository(Room)
    private readonly roomRepo: Repository<Room>,
    private dataSource: DataSource,
    private readonly doWithException: DoWithExceptions,
  ) {}

  async isInInventory(user_id: number, item_id: number): Promise<boolean> {
    const result = await this.itemInventoryRepo.findOneBy({ user_id, item_id });
    return result !== null;
  }

  async isInMyRoom(user_id: number, item_id: number): Promise<boolean> {
    const result1 = await this.roomRepo.findOneBy({ user_id, item_id });
    return result1 !== null;
  }

  async overlap(user_id: number, items: number[]): Promise<any> {
    
    const qr  = this.dataSource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();
    
    var result = [];

    try {
        // 기존의 room아이템 모두 삭제
        await this.roomRepo.delete({ user_id });

        for (const item_id of items) {
          if (!(await this.isInInventory(user_id, item_id))) {
            throw this.doWithException.ItemNotInInventory;
          }
          if (await this.isInMyRoom(user_id, item_id)) {
            throw this.doWithException.ItemAlreadyInMyRoom;
          }

          // 보유한 아이템 + 방에 없음 -> 방에 추가
          result.push(await this.roomRepo.save({ user_id, item_id }));
        }
      }
      catch(err)  {
        await qr.rollbackTransaction();
        throw new DoWithExceptions().FailedToUpdateMyRoom;
      }
      finally {
        qr.release();
      };

    return { result };
  }

  async findAll(user_id: number) {
    const result = await this.roomRepo
      .createQueryBuilder('r')
      .leftJoin('item_inventory', 'iv', 'r.item_id = iv.item_id AND r.user_id = iv.user_id')
      .leftJoin('item_shop', 'ish', 'r.item_id = ish.item_id')
      .select([
        'r.user_id as user_id',
        'ish.item_id as item_id',
        'ish.type_id as item_type',
        'ish.metadata as metadata',
        'ish.item_name as item_name',
        'ish.item_path as item_path',
        'iv.pet_name as pet_name',
        'iv.pet_exp as pet_exp',
      ])
      .where('r.user_id = :user_id', { user_id })
      .getRawMany();
    return { result };
  }
}
