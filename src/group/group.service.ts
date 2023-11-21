import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Group } from './entities/group.entity';
import { DataSource, Raw, Repository } from 'typeorm';
import { CreateGroupDto } from './dto/create-group.dto';
import { UserGroup } from 'src/user_group/entities/user_group.entity';
import { Todo } from 'src/todo/todo.entity';
import { DoWithExceptions } from 'src/do-with-exception/do-with-exception';

@Injectable()
export class GroupService {
  constructor(
    @InjectRepository(Group)
    private readonly groupRepository: Repository<Group>,
    @InjectRepository(UserGroup)
    private readonly userGroupRepository: Repository<UserGroup>,
    private readonly doWithException: DoWithExceptions,
    private dataSource: DataSource,
    private readonly logger: Logger
  ){}

  async getGroupAll(): Promise<Group[]>{
    const result = await this.groupRepository.createQueryBuilder('g')
                                             .select([
                                               'g.grp_id          AS grp_id'
                                             , 'g.grp_name        AS grp_name'
                                             , 'MAX(u2.user_name) AS owner'
                                             , 'COUNT(u1.user_id) AS mem_cnt'
                                             ])
                                             .leftJoin('user_group', 'ug', 'g.grp_id = ug.grp_id')
                                             .leftJoin('user'      , 'u1', 'ug.user_id = u1.user_id')
                                             .leftJoin('user'      , 'u2', 'g.grp_owner = u2.user_id')
                                             .orderBy('COUNT(u1.user_id)', 'DESC')
                                             .groupBy('g.grp_id')
                                             .getRawMany();

    this.logger.debug(result);

    return result;
  }

  async createGroupOne(createGroupDto: CreateGroupDto): Promise<any>{
    const queryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try{
      createGroupDto.grp_owner =  createGroupDto.user_id;
      createGroupDto['category'] = { cat_id: createGroupDto.cat_id, cat_name: 'Unreached code'};

      const grpIns = await queryRunner.manager.save(Group, createGroupDto);
      const ug = new UserGroup();

      ug.user_id = +createGroupDto.user_id;
      ug.grp_id = +grpIns.grp_id
      
      const ugIns = await queryRunner.manager.save(UserGroup ,ug);
      await queryRunner.commitTransaction();

      return { grpIns, ugIns };

    } catch(err){
      await queryRunner.rollbackTransaction();
      throw this.doWithException.FailedToMakeGroup;
    }
  }

  async getGroupOne(grp_id: number): Promise<any>{
    const grp_detail = await this.groupRepository.createQueryBuilder('g')
                                                 .select([
                                                     'g.grp_id    AS grp_id'
                                                   , 'g.grp_name  AS grp_name'
                                                   , 'g.grp_decs  AS grp_desc'
                                                   , `to_char(g.reg_at, 'yyyy-MM-dd HH:MI:SS') AS reg_at`
                                                   , 'u.user_name AS user_name'
                                                   , 'c.cat_name  AS cat_name'
                                                 ])
                                                 .leftJoin('user_group', 'ug', 'g.grp_owner = ug.grp_id')
                                                 .leftJoin('user'      , 'u' , 'ug.user_id = u.user_id')
                                                 .leftJoin('category'  , 'c' , 'c.cat_id = g.cat_id')
                                                 .where('g.grp_id = :grp_id', { grp_id })
                                                 .getRawOne();

    const rout_detail = await this.groupRepository.createQueryBuilder('g')
                                                  .select([
                                                    'r.rout_id   AS rout_id'
                                                  , 'r.rout_name AS rout_name'
                                                  , 'r.rout_desc AS rout_desc'
                                                  ])
                                                  .leftJoin('routine', 'r', 'g.grp_id = r.grp_id')
                                                  .where('g.grp_id = :grp_id', { grp_id })
                                                  .getRawMany();
    
    const grp_mems = await this.groupRepository.createQueryBuilder('g')
                                               .select([
                                                 'u.user_id    AS user_id'
                                               , 'u.user_name  AS user_name'
                                               , 'u.last_login AS last_login'
                                               ])
                                               .leftJoin('user_group', 'ug', 'g.grp_id = ug.grp_id')
                                               .leftJoin('user'      , 'u' , 'u.user_id = ug.user_id')
                                               .where('g.grp_id = :grp_id', { grp_id })
                                               .getRawMany();

    this.logger.debug(grp_detail);
    this.logger.debug(rout_detail);
    this.logger.debug(grp_mems);
    
    return {grp_detail, rout_detail, grp_mems};
  }

  async getAllMyGroups(user_id: number): Promise<Promise<Group[]>>{
    const Count = await this.groupRepository.createQueryBuilder('g')
                                            .select([ 'g.grp_id AS grp_id'
                                                    , 'count(*) AS mem_cnt'])
                                            .leftJoin('user_group', 'ug', 'g.grp_id = ug.grp_id')
                                            .leftJoin('user'      , 'u' , 'ug.user_id = u.user_id')
                                            .groupBy('g.grp_id')
                                            .getQuery();

    const result = await this.groupRepository.createQueryBuilder('g')
                                             .select([
                                                'g.grp_id          AS grp_id'
                                              , 'g.grp_name        AS grp_name'
                                              , 'g.grp_decs        AS grp_decs'
                                              , 'MAX(u2.user_name) AS owner'
                                              , 'g.cat_id          AS cat_id'
                                              , 'MAX(c.cat_name)   AS cat_name'
                                              , 'MAX(g2.mem_cnt)   AS mem_cnt'
                                             ])
                                             .leftJoin('user_group', 'ug', 'g.grp_id = ug.grp_id')
                                             .leftJoin('user'      , 'u1', 'ug.user_id = u1.user_id')
                                             .leftJoin('user'      , 'u2', 'g.grp_owner = u2.user_id')
                                             .leftJoin('category'  , 'c' , 'g.cat_id = c.cat_id')
                                             .leftJoin(`(${Count})`, 'g2', 'g.grp_id = g2.grp_id')
                                             .where('u1.user_id = :user_id', { user_id })
                                             .groupBy('g.grp_id')
                                             .orderBy('MAX(g2.mem_cnt)', 'DESC')
                                             .getRawMany();
    this.logger.debug(result);
    return result;
  }

  async createJoinGroup(grp_id: number, user_id: number): Promise<any>{
    const userGrpInsert = new UserGroup();

    userGrpInsert.user_id = user_id;
    userGrpInsert.grp_id = grp_id;

    return await this.userGroupRepository.save(userGrpInsert);
  }
  
  async leftGroup(grp_id: number, user_id: number): Promise<any>{
    const queryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try{
      const ugDel = await queryRunner.manager.delete(UserGroup, { grp_id, user_id });
      const todoUpt = await queryRunner.manager.update(
          Todo
        , { user_id, grp_id, todo_date: Raw(todo_date => `to_char(${todo_date}, 'yyyyMMdd') = to_char(now(), 'yyyyMMdd')`),}
        , { todo_deleted: true }
      )

      await queryRunner.commitTransaction();

      return { ugDel, todoUpt };

    } catch(err) {
      await queryRunner.rollbackTransaction();
      throw this.doWithException.FailedToleftGroup;
    } 
  }

  async getMemberTodoInGroup(grp_id: number, user_id: number): Promise<any[]>{
    const result = await this.groupRepository.createQueryBuilder('g')
                                             .select(['t.todo_img AS todo_img'])
                                             .leftJoin('todo'   , 't', 't.grp_id = g.grp_id')
                                             .leftJoin('routine', 'r', 't.grp_id = r.grp_id')
                                             .where('t.todo_img IS NOT NULL')
                                             .andWhere('g.grp_id = :grp_id', {grp_id})
                                             .groupBy('t.todo_id')
                                             .orderBy('t.todo_id')
                                             .getRawMany();
    this.logger.debug(result);                                  

    return result;
  }

  async getGroupsBySearching(user_id: number, cat_id: number, keyword: string): Promise<any[]>{
    const result = await this.groupRepository.createQueryBuilder('g')
                                             .select([
                                               'g.grp_id          AS grp_id'
                                             , 'g.grp_name        AS grp_name' 
                                             , 'g.grp_decs        AS grp_decs' 
                                             , 'g.grp_owner       AS grp_owner'
                                             , 'max(c.cat_name)   AS cat_name'
                                             , 'max(u2.user_name) AS owner'
                                             , 'count(u1.user_id) AS mem_cnt'
                                             ])
                                             .leftJoin('category'  , 'c' , 'g.cat_id = c.cat_id')
                                             .leftJoin('user_group', 'ug', 'g.grp_id = ug.grp_id')
                                             .leftJoin('user'      , 'u1', 'ug.user_id = u1.user_id')
                                             .leftJoin('user'      , 'u2', 'g.grp_owner = u2.user_id')
                                             .groupBy('g.grp_id');

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

  async updateImage(grp_id: number, user_id: number, file: Express.Multer.File){
    if(!file){
      throw new Error();
    }

    return file.path;
  }

  async deleteGroup(grp_id: number){
    return await this.groupRepository.softDelete({grp_id});
  }
}