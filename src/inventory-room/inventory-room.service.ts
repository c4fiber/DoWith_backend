import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InventoryRoom } from './entities/inventory-room.entity';
import { DataSource } from 'typeorm';
import { ItemInventory } from 'src/item-inventory/entities/item-inventory.entity';
import { isIn } from 'class-validator';

@Injectable()
export class InventoryRoomService {
  constructor(
    @InjectRepository(InventoryRoom)
    private readonly itemInventoryRepo: Repository<ItemInventory>,
    private readonly inventoryRoomRepo: Repository<InventoryRoom>,
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
    const result = await this.inventoryRoomRepo.findOneBy({ user_id, item_id });

    return { result };
  }

  // for controller
  async create(user_id: number, item_id: number): Promise<any> {
    if (!this.isValid(user_id, item_id)) {
      throw new Error('Already exist');
    }

    return { result: this.inventoryRoomRepo.save({ user_id, item_id }) };
  }

  async findAll(user_id: number) {
    const results = await this.inventoryRoomRepo.findBy({ user_id });
    return { results };
  }

  async remove(user_id: number, item_id: number) {
    if (!(await this.isInMyRoom(user_id, item_id))) {
      throw new Error('Not exist');
    }

    const result = await this.inventoryRoomRepo.delete({ user_id, item_id });
    return { result };
  }
}
