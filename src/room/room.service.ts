import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Room } from './entities/room.entity';
import { DataSource } from 'typeorm';
import { ItemInventory } from 'src/item-inventory/entities/item-inventory.entity';
import { isIn } from 'class-validator';

@Injectable()
export class RoomService {
  constructor(
    @InjectRepository(ItemInventory)
    private readonly itemInventoryRepo: Repository<ItemInventory>,
    @InjectRepository(Room)
    private readonly roomRepo: Repository<Room>,
    private dataSource: DataSource,
  ) {}

  async isInInventory(user_id: number, item_id: number): Promise<boolean> {
    return (
      null !== (await this.itemInventoryRepo.findOneBy({ user_id, item_id }))
    );
  }

  async isInMyRoom(user_id: number, item_id: number): Promise<boolean> {
    return null !== (await this.findOne(user_id, item_id));
  }

  async isValid(user_id: number, item_id: number): Promise<boolean> {
    return (
      (await this.isInInventory(user_id, item_id)) &&
      !(await this.isInMyRoom(user_id, item_id))
    );
  }

  async findOne(user_id, item_id): Promise<any> {
    const result = await this.roomRepo.findOneBy({ user_id, item_id });

    return { result };
  }

  // for controller
  async create(user_id: number, item_id: number): Promise<any> {
    if (!this.isValid(user_id, item_id)) {
      throw new Error('Already exist');
    }

    // TODO 펫이 여러마리 들어가면 안된다.

    return { result: this.roomRepo.save({ user_id, item_id }) };
  }

  async findAll(user_id: number) {
    const result = await this.roomRepo
      .createQueryBuilder('r')
      .where('r.user_id = :user_id', { user_id })
      .leftJoin('item_inventory', 'iv', 'r.item_id = iv.item_id')
      .leftJoin('item_shop', 'ish', 'r.item_id = ish.item_id')
      .select([
        'iv.pet_name as pet_name',
        'iv.pet_exp as pet_exp',
        'ish.item_name as item_name',
        'ish.item_path as item_path',
        'ish.item_id as item_id',
      ])
      .getRawMany();
    return { result };
  }

  async remove(user_id: number, item_id: number) {
    if (!(await this.isInMyRoom(user_id, item_id))) {
      throw new Error('Not exist');
    }

    const result = await this.roomRepo.delete({ user_id, item_id });
    return { result };
  }
}
