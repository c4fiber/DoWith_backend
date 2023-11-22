import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Group } from './entities/group.entity';
import { DataSource, Raw, Repository } from 'typeorm';
import { CreateGroupDto } from './dto/create-group.dto';
import { UserGroup } from 'src/user_group/entities/user_group.entity';
import { Todo } from 'src/todo/todo.entity';
import { DoWithExceptions } from 'src/do-with-exception/do-with-exception';
import { Routine } from 'src/routine/entities/routine.entity';

@Injectable()
export class GroupService {
  constructor(
    @InjectRepository(Group)
    private readonly groupRepository: Repository<Group>,
    @InjectRepository(UserGroup)
    private readonly userGroupRepository: Repository<UserGroup>,
    @InjectRepository(Todo)
    private readonly todoRepository: Repository<Todo>,
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

  async createGroupOne(createGroupDto: CreateGroupDto, routs: Array<any>): Promise<any>{
    const queryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try{
      createGroupDto.grp_owner =  createGroupDto.user_id;
      createGroupDto['category'] = { cat_id: createGroupDto.cat_id, cat_name: 'Unreached code'};

      // Group Insert
      const grpIns = await queryRunner.manager.save(Group, createGroupDto);
      const ug = new UserGroup();

      ug.user_id = +createGroupDto.user_id;
      ug.grp_id = +grpIns.grp_id
      
      // UserGroup Insert
      const ugIns = await queryRunner.manager.save(UserGroup ,ug);
      
      // Routine Insert
      routs.forEach(async (data) => {
        const rout = new Routine();

        rout.grp_id = ug.grp_id;
        rout.rout_name = data.rout_name;
        rout.rout_desc = data.rout_desc;
        rout.rout_repeat = data.rout_repeat;
        rout.rout_srt = data.rout_srt;
        rout.rout_end = data.rout_end;

        await queryRunner.manager.save(Routine, rout);
        const todo = new Todo();

        todo.grp_id = ug.grp_id;
        todo.user_id = ug.user_id;
        todo.todo_name = data.rout_name;
        todo.todo_desc = data.rout_desc;
        todo.todo_start = data.rout_srt;
        todo.todo_end = data.rout_end;

        await queryRunner.manager.save(Todo, todo);
      });

      await queryRunner.commitTransaction();
      return { grpIns };

    } catch(err){
      this.logger.error(err);
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

  async getMemberTodoInGroup(grp_id: number, user_id: number): Promise<any>{
    const result = await this.groupRepository.createQueryBuilder('g')
                                             .select(['t.todo_img AS todo_img'])
                                             .leftJoin('todo'   , 't', 't.grp_id = g.grp_id')
                                             .leftJoin('routine', 'r', 't.grp_id = r.grp_id')
                                             .where('t.user_id = :user_id', {user_id})
                                             .andWhere('g.grp_id = :grp_id', {grp_id})
                                             .groupBy('t.todo_id')
                                             .orderBy('t.todo_id')
                                             .getRawMany();
    this.logger.debug(result);                                  

    return { 'path': process.env.IMAGE_PATH, result} ;
  }

  async getGroupsBySearching(user_id: number, cat_id: number, keyword: string): Promise<any[]>{
    const myGrps = await this.groupRepository.createQueryBuilder('g')
                                             .leftJoin('user_group', 'ug', 'g.grp_id = ug.grp_id')
                                             .select(['g.grp_id AS grp_id'])
                                             .where('ug.user_id = :user_id', {user_id})
                                             .getRawMany();

    const myGrpsIds = myGrps.map(data => data.grp_id);

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
                                             .where('1 = 1')
                                             .leftJoin('category'  , 'c' , 'g.cat_id = c.cat_id')
                                             .leftJoin('user_group', 'ug', 'g.grp_id = ug.grp_id')
                                             .leftJoin('user'      , 'u1', 'ug.user_id = u1.user_id')
                                             .leftJoin('user'      , 'u2', 'g.grp_owner = u2.user_id')
                                             .groupBy('g.grp_id');

    if(myGrpsIds.length > 0){
      result.where('g.grp_id NOT IN (:...myGrpsIds)', { myGrpsIds });
    }

    if(cat_id != 1){  // 1: 전체
      result.andWhere('c.cat_id = :cat_id', {cat_id});
    }

    if(keyword){
      result.andWhere('(g.grp_name LIKE :keyword OR u2.user_name LIKE :keyword)', { keyword : `%${keyword}%` });
    }

    return result.orderBy('count(u1.user_id)', 'DESC')
                 .getRawMany();
  }

  async updateImage(todo_id: number, user_id: number, file: Express.Multer.File){
    if(!file){
      throw this.doWithException.ThereIsNoFile;
    }
    
    const todoIns = await this.todoRepository.createQueryBuilder('t')
                                             .update({todo_img: file.filename})
                                             .where({ todo_id })
                                             .andWhere({ user_id })
                                             .execute();

    return todoIns;
  }

  async deleteGroup(grp_id: number){
    return await this.groupRepository.softDelete({grp_id});
  }
}