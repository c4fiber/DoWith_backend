import { Injectable } from '@nestjs/common';
import { ItemInventory } from './entities/item-inventory.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class ItemInventoryService {
  constructor(
    @InjectRepository(ItemInventory)
    private readonly itemInventoryRepository: Repository<ItemInventory>
  ){}

  async renameMyPet(user_id: number, item_id: number, pet_name: string){
    const result = await this.itemInventoryRepository.createQueryBuilder('iv')
                                                     .update()
                                                     .set({ 
                                                       pet_name: pet_name
                                                     , pet_exp: 0
                                                     })
                                                     .where({ user_id })
                                                     .andWhere({ item_id })
                                                     .execute();

    return { result };
  }

  async findAll(user_id: number) {
    const result = await this.itemInventoryRepository.findBy({ user_id });
    return { result };
  }
}