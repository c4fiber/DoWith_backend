import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Group } from './entities/group.entity';
import { DataSource, Raw, Repository } from 'typeorm';
import { CreateGroupDto } from './dto/create-group.dto';
import { UserGroup } from 'src/user_group/entities/user_group.entity';
import { Todo } from 'src/todo/todo.entity';
import { User } from 'src/user/user.entities';
import { DoWithExceptions } from 'src/do-with-exception/do-with-exception';
import { Routine } from 'src/routine/entities/routine.entity';
import * as sharp from 'sharp'
import * as fs from 'fs/promises'
import * as path from 'path';

import { applyPaging, getIdsFromItems } from 'src/utils/paging/PagingOptions';

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
    private dataSource: DataSource
  ){}

  async getGroupAll(pagingOptions: { page: number; limit: number }): Promise<{results: Group[], total: number}>{
    const { page, limit } = pagingOptions;
    const query = await this.groupRepository.createQueryBuilder('g')
                                            .leftJoin('user_group', 'ug', 'g.grp_id = ug.grp_id')
                                            .leftJoin('user'      , 'u1', 'ug.user_id = u1.user_id')
                                            .leftJoin('user'      , 'u2', 'g.grp_owner = u2.user_id');
    const [ items, total ] = await applyPaging(query, page, limit);
    const grpIds = getIdsFromItems(items, "grp_id");

    const results = await query.select([
                                 'g.grp_id               AS grp_id'
                               , 'g.grp_name             AS grp_name'
                               , 'MAX(u2.user_name)      AS owner'
                               , 'COUNT(u1.user_id)::int AS mem_cnt'
                               ])
                               .where('g.grp_id IN (:...grpIds)', { grpIds })
                               .orderBy('COUNT(u1.user_id)', 'DESC')
                               .groupBy('g.grp_id')
                               .getRawMany();

    return { results, total };
  }

  async createGroupOne(createGroupDto: CreateGroupDto, routs: Array<any>): Promise<any>{
    const queryRunner = this.dataSource.createQueryRunner();

    try{
      await queryRunner.connect();
      await queryRunner.startTransaction();

      createGroupDto.grp_owner =  createGroupDto.user_id;
      createGroupDto['category'] = { cat_id: createGroupDto.cat_id, cat_name: 'Unreached code'};

      // Group Insert
      const result = await queryRunner.manager.save(Group, createGroupDto);
      const ug = new UserGroup();

      ug.user_id = +createGroupDto.user_id;
      ug.grp_id = +result.grp_id

      // UserGroup Insert
      const ugIns = await queryRunner.manager.save(UserGroup ,ug);

      // Routine Insert
      for(const data of routs) {
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
    }

      await queryRunner.commitTransaction();
      return { result };

    } catch(err){
      await queryRunner.rollbackTransaction();
      throw new Error(err);
    } finally {
      await queryRunner.release();
    }
  }

  async getGroupOne(grp_id: number): Promise<{result:{grp_detail: Group, rout_detail:Array<any>, grp_mems:Array<any>}}>{
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

    return { result: { grp_detail, rout_detail, grp_mems }};
  }

  async getAllMyGroups(
      user_id: number
    , pagingOptions: { page: number; limit: number }
  ): Promise<Promise<{results: Group[], total: number}>>{
    const { page, limit } = pagingOptions;
    const Count = await this.groupRepository.createQueryBuilder('g')
                                            .select([ 'g.grp_id AS grp_id'
                                                    , 'count(*) AS mem_cnt'])
                                            .leftJoin('user_group', 'ug', 'g.grp_id = ug.grp_id')
                                            .leftJoin('user'      , 'u' , 'ug.user_id = u.user_id')
                                            .groupBy('g.grp_id')
                                            .getQuery();

    const query = await this.groupRepository.createQueryBuilder('g')
                                            .leftJoin('user_group', 'ug', 'g.grp_id = ug.grp_id')
                                            .leftJoin('user'      , 'u1', 'ug.user_id = u1.user_id')
                                            .leftJoin('user'      , 'u2', 'g.grp_owner = u2.user_id')
                                            .leftJoin('category'  , 'c' , 'g.cat_id = c.cat_id')
                                            .leftJoin(`(${Count})`, 'g2', 'g.grp_id = g2.grp_id')
                                            .where('u1.user_id = :user_id', { user_id });
    

    const [ items, total ] = await applyPaging(query, page, limit);
    const grpIds = getIdsFromItems(items, "grp_id");
    const results = await query.select([
                                 'g.grp_id          AS grp_id'
                               , 'g.grp_name        AS grp_name'
                               , 'g.grp_decs        AS grp_decs'
                               , 'MAX(u2.user_name) AS owner'
                               , 'g.cat_id          AS cat_id'
                               , 'MAX(c.cat_name)   AS cat_name'
                               , 'MAX(g2.mem_cnt)   AS mem_cnt'
                               ])
                               .andWhere('g.grp_id IN (:...grpIds)', { grpIds })
                               .groupBy('g.grp_id')
                               .orderBy('MAX(g2.mem_cnt)', 'DESC')
                               .getRawMany();

    return { results, total };
  }

  async JoinGroup(grp_id: number, user_id: number): Promise<any>{
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try{
      const result = await queryRunner.manager.save(UserGroup, { user_id, grp_id });
      const routs = await this.groupRepository.createQueryBuilder('g')
                                              .leftJoin('routine', 'r', 'g.grp_id = r.grp_id')
                                              .select([
                                                  'r.rout_name AS todo_name'
                                                , 'r.rout_desc AS todo_desc'
                                                , 'g.cat_id    AS todo_label'
                                                , 'r.rout_srt  AS todo_start'
                                                , 'r.rout_end  AS todo_end'
                                              ])
                                              .where({ grp_id })
                                              .getRawMany();
      
      for(const rout of routs){
        const todo = new Todo();

        todo.user_id = user_id;
        todo.grp_id = grp_id;
        todo.todo_name = rout.todo_name;
        todo.todo_desc = rout.todo_desc;
        todo.todo_label = rout.todo_label;
        todo.todo_start = rout.todo_start;
        todo.todo_end = rout.todo_end;

        await queryRunner.manager.save(Todo, todo);
      }

      await queryRunner.commitTransaction();

      return { result };
    } catch(err){
      await queryRunner.rollbackTransaction();
      throw new Error(err);
    } finally {
      await queryRunner.release();
    }
  }
  
  async leftGroup(grp_id: number, user_id: number): Promise<any>{
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try{
      const result = await queryRunner.manager.delete(UserGroup, { user_id, grp_id });
      await queryRunner.manager.update(
          Todo
        , { user_id, grp_id, todo_date: Raw(todo_date => `to_char(${todo_date}, 'yyyyMMdd') = to_char(now(), 'yyyyMMdd')`),}
        , { todo_deleted: true }
      )

      await queryRunner.commitTransaction();

      return { result };

    } catch(err) {
      await queryRunner.rollbackTransaction();
      throw new Error(err);
    } finally {
      await queryRunner.release();
    }
  }

  async getMemberTodoInGroup(grp_id: number, rout_id: number): Promise<any>{
    const results = await this.groupRepository.createQueryBuilder('g')
                                              .select([
                                                't.user_id   AS user_id'
                                              , 't.todo_img  AS todo_img'
                                              , 't.todo_done AS todo_done'
                                              , 'u.user_name AS user_name'
                                              ])
                                              .leftJoin('todo'   , 't', 't.grp_id = g.grp_id')
                                              .leftJoin('routine', 'r', 't.grp_id = r.grp_id AND t.rout_id = r.rout_id')
                                              .leftJoin('user'   , 'u', 'u.user_id = t.user_id')
                                              .where('t.todo_img IS NOT NULL')
                                              .andWhere('g.grp_id = :grp_id', { grp_id })
                                              .andWhere('r.rout_id = :rout_id', { rout_id })
                                              .orderBy('t.todo_id')
                                              .getRawMany();

    return { results, path: process.env.IMAGE_PATH } ;
  }

  async getGroupsBySearching(
      user_id: number
    , cat_id: number
    , keyword: string
    ,pagingOptions: { page: number; limit: number }
  ): Promise<{ results: Group[], total: number}>{
    const { page, limit } = pagingOptions;
    const myGrps = await this.groupRepository.createQueryBuilder('g')
                                             .leftJoin('user_group', 'ug', 'g.grp_id = ug.grp_id')
                                             .select(['g.grp_id AS grp_id'])
                                             .where('ug.user_id = :user_id', { user_id })
                                             .getRawMany();
    const myGrpsIds = myGrps.map(data => data.grp_id);
    const query = await this.groupRepository.createQueryBuilder('g')
                                             .leftJoin('category'  , 'c' , 'g.cat_id = c.cat_id')
                                             .leftJoin('user_group', 'ug', 'g.grp_id = ug.grp_id')
                                             .leftJoin('user'      , 'u1', 'ug.user_id = u1.user_id')
                                             .leftJoin('user'      , 'u2', 'g.grp_owner = u2.user_id')
                                             .where('1 = 1')
                                             .groupBy('g.grp_id');

    if(myGrpsIds.length > 0){
      query.andWhere('g.grp_id NOT IN (:...myGrpsIds)', { myGrpsIds });
    }

    if(cat_id != 1){  // 1: 전체
      query.andWhere('c.cat_id = :cat_id', { cat_id });
    }

    if(keyword){
      query.andWhere('(g.grp_name LIKE :keyword OR u2.user_name LIKE :keyword)', { keyword : `%${keyword}%` });
    }

    const [ items, total ] = await applyPaging(query, page, limit);
    const grpIds = getIdsFromItems(items, "grp_id");
    const results = await query.select([
                                 'g.grp_id          AS grp_id'
                               , 'g.grp_name        AS grp_name' 
                               , 'g.grp_decs        AS grp_decs' 
                               , 'g.grp_owner       AS grp_owner'
                               , 'max(c.cat_name)   AS cat_name'
                               , 'max(u2.user_name) AS owner'
                               , 'count(u1.user_id) AS mem_cnt'
                               ])
                               .andWhere('g.grp_id IN (:...grpIds)', { grpIds })
                               .orderBy('count(u1.user_id)', 'DESC')
                               .getRawMany();

    return { results, total };
  }

  async updateImage(todo_id: number, user_id: number, file: Express.Multer.File): Promise<any>{
    if(!file){
      throw this.doWithException.ThereIsNoFile;
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
                                        
    try {
      const filePath = file.path;
      const ext = path.extname(file.originalname);
      const name = path.basename(file.originalname, ext);
      const newPath = `${process.env.IMAGE_PATH}${name}_${Date.now()}${ext}`;

      await sharp(filePath).resize({ width: 1000, height: 1000, fit: 'contain' })
                           .toFile(newPath, async(err, info) => {
                              await fs.unlink(filePath);  // 업로드한 원본 파일 삭제
                           });
      
      const oldFile = await this.todoRepository.createQueryBuilder('t')
                                               .select(['t.todo_img AS todo_img'])
                                               .where({ todo_id })
                                               .andWhere({ user_id })
                                               .getRawOne();

      if(oldFile.todo_img){
        await fs.unlink(oldFile.todo_img);  // 기존에 저장했던 인증 사진 삭제(새로운 사진 업로드 했으니까)
      }

      const result = await this.todoRepository.createQueryBuilder('t')
                                              .update({ todo_img: newPath })
                                              .where({ todo_id })
                                              .andWhere({ user_id })
                                              .execute();

      await queryRunner.commitTransaction();
      return { result };
    } catch(err) {
      await queryRunner.rollbackTransaction();
      throw new Error(err);
    } finally {
      await queryRunner.release();
    }
  }

  async updateTodoDone(todo_id: number): Promise<any>{
    const result = await this.todoRepository.createQueryBuilder('t')
                                            .update({ todo_done: true })
                                            .where({ todo_id })
                                            .execute();
     
    return { result };
  }

  async deleteGroup(grp_id: number): Promise<any>{
    const result = await this.groupRepository.softDelete({grp_id}); 
    
    return { result };
  }

  async findUsersByGroupId(groupId: number): Promise<User[]> {
    const group = await this.groupRepository.findOne({
      where: { grp_id: groupId },
      relations: ['users'],
    });

    return group ? group.users : [];
  }
}