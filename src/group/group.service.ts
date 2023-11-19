import { Inject, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Group } from './entities/group.entity';
import { Repository } from 'typeorm';
import { CreateGroupDto } from './dto/create-group.dto';

@Injectable()
export class GroupService {
  constructor(
    @InjectRepository(Group)
    private readonly groupRepository: Repository<Group>,
    private readonly logger: Logger
  ){}

  async getGroupAll(): Promise<Group[]>{
    const result = await this.groupRepository.createQueryBuilder('g')
                                             .leftJoin('user_group', 'ug', 'g.grp_id = ug.grp_id')
                                             .leftJoin('user'      , 'u1', 'ug.user_id = u1.user_id')
                                             .leftJoin('user'      , 'u2', 'g.grp_owner = u2.user_id')
                                             .groupBy('g.grp_id')
                                             .select([
                                                        'g.grp_id          AS grp_id'
                                                      , 'g.grp_name        AS grp_name'
                                                      , 'MAX(u2.user_name) AS owner'
                                                      , 'COUNT(u1.user_id) AS mem_cnt'
                                                    ])
                                             .getRawMany();

    this.logger.debug(result);

    return result;
  }

  async createGroupOne(createGroupDto: CreateGroupDto): Promise<Group>{
    // 빈칸으로 삽입되는거 막아지지가 않네? Entity, Dto 다 시도해 봤는데?
    return await this.groupRepository.save(createGroupDto);
  }

  async getGroupOne(grp_id: number): Promise<any>{
    const rout_detail = await this.groupRepository.createQueryBuilder('g')
                                                  .leftJoin('routine', 'r', 'g.grp_id = r.grp_id')
                                                  .where('g.grp_id = :grp_id', { grp_id })
                                                  .select([
                                                    'r.rout_name AS rout_name'
                                                  , 'r.rout_desc AS rout_desc'
                                                ])
                                                  .getRawMany();
    
    const grp_mems = await this.groupRepository.createQueryBuilder('g')
                                               .leftJoin('user_group', 'ug', 'g.grp_id = ug.grp_id')
                                               .leftJoin('user'      , 'u' , 'u.user_id = ug.user_id')
                                               .where('g.grp_id = :grp_id', { grp_id })
                                               .select([
                                                'u.*' 
                                              ])
                                               .getRawMany();

    this.logger.debug(rout_detail);
    this.logger.debug(grp_mems);
    
    return {rout_detail, grp_mems};
  }

  async getAllMyGroup(user_id: number): Promise<Promise<Group[]>>{
    const result = await this.groupRepository.createQueryBuilder('g')
                                             .leftJoin('user_group', 'ug', 'g.grp_id = ug.grp_id')
                                             .leftJoin('user'      , 'u1', 'ug.user_id = u1.user_id')
                                             .leftJoin('user'      , 'u2', 'g.grp_owner = u2.user_id')
                                             .where('ug.user_id = :user_id', { user_id })
                                             .groupBy('g.grp_id')
                                             .select([
                                                        'g.grp_id          AS grp_id'
                                                      , 'g.grp_name        AS grp_name'
                                                      , 'MAX(u2.user_name) AS owner'
                                                      , 'COUNT(u1.user_id) AS mem_cnt'
                                                    ])
                                             .getRawMany();
    this.logger.debug(result);
    return result;
  }

  async getMemberTodoInGroup(grp_id: number, user_id: number): Promise<any[]>{
    const result = await this.groupRepository.createQueryBuilder('g')
                                             .leftJoin('todo'   , 't', 't.grp_id = g.grp_id')
                                             .leftJoin('routine', 'r', 't.grp_id = r.grp_id')
                                             .where('t.todo_img IS NOT NULL')
                                             .andWhere('g.grp_id = :grp_id', {grp_id})
                                             .groupBy('t.todo_id')
                                             .orderBy('t.todo_id')
                                             //.select(['t.*'])
                                             .select(['t.todo_img AS todo_img'])
                                             .getRawMany();
    this.logger.debug(result);                                  

    return result;
  }

  async getGroupsBySearching(user_id: number, cat_id: number, keyword: string): Promise<any[]>{
    const result = await this.groupRepository.createQueryBuilder('g')
                                             .leftJoin('category'  , 'c' , 'g.cat_id = c.cat_id')
                                             .leftJoin('user_group', 'ug', 'g.grp_id = ug.grp_id')
                                             .leftJoin('user'      , 'u1', 'ug.user_id = u1.user_id')
                                             .leftJoin('user'      , 'u2', 'g.grp_owner = u2.user_id')
                                             .groupBy('g.grp_id')
                                             .select([
                                                'g.grp_id          AS grp_id'
                                              , 'g.grp_name        AS grp_name' 
                                              , 'g.grp_decs        AS grp_decs' 
                                              , 'g.grp_owner       AS grp_owner'
                                              , 'max(c.cat_name)   AS cat_name'
                                              , 'max(u2.user_name) AS owner'
                                              , 'count(u1.user_id) AS mem_cnt'
                                             ]);

    if(cat_id != 1){  // 1: 전체
      result.andWhere('c.cat_id = :cat_id', {cat_id});
    }

    if(keyword){
      result.andWhere('(g.grp_name LIKE :keyword OR u2.user_name LIKE :keyword)', { keyword : `%${keyword}%` });
    }

    return result.andWhere('u2.user_id != :user_id', { user_id })
                 .orderBy('count(u1.user_id)', 'DESC')
                 .getRawMany();
  }

  async deleteGroup(grp_id: number){
    return await this.groupRepository.softDelete({grp_id});
  }
}