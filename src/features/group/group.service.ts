import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Group } from '../../entities/group.entity';
import { DataSource, Raw, Repository } from 'typeorm';
import { CreateGroupDto } from './dto/create-group.dto';
import { UserGroup } from 'src/entities/user_group.entity';
import { Todo } from 'src/entities/todo.entity';
import { User } from 'src/entities/user.entities';
import { DoWithExceptions } from 'src/utils/do-with-exception';
import { Routine } from 'src/entities/routine.entity';
import * as sharp from 'sharp'
import * as fs from 'fs/promises'
import * as path from 'path';

import { applyPaging, getIdsFromItems } from 'src/utils/PagingOptions';
import { Reward } from 'src/enums/Reward.enum';

@Injectable()
export class GroupService {
  constructor(
    @InjectRepository(Group)
    private readonly grpRepo: Repository<Group>,
    @InjectRepository(Todo)
    private readonly todoRepo: Repository<Todo>,
    private readonly dwExcept: DoWithExceptions,
    private dataSource: DataSource
  ){}

  /**
   * 모든 그룹 조회하는 함수
   * @description 서버에 등록된 모든 그룹을 조회한다.
   * @param pagingOptions 페이징 처리할 때 queryString에서 page와 보여질 개수 인자 값
   * @returns result: 그룹 리스트(페이징)
   *          total : 총 리스트 개수
   */
  async getGroupAll(pagingOptions: { page: number; limit: number }): Promise<{result: Group[], total: number}>{
    const { page, limit } = pagingOptions;
    const query = await this.grpRepo.createQueryBuilder('g')
                                    .leftJoin('user_group', 'ug', 'g.grp_id = ug.grp_id')
                                    .leftJoin('user'      , 'u1', 'ug.user_id = u1.user_id')
                                    .leftJoin('user'      , 'u2', 'g.grp_owner = u2.user_id');
    const [ items, total ] = await applyPaging(query, page, limit);
    const grpIds = getIdsFromItems(items, "grp_id");

    // 모든 그룹중에서 해당 페이지에 해당하는 그룹만 보여주는 쿼리
    const result = await query.select([
                                'g.grp_id               AS grp_id'
                              , 'g.grp_name             AS grp_name'
                              , 'MAX(u2.user_name)      AS owner'
                              , 'COUNT(u1.user_id)::int AS mem_cnt'
                              ])
                              .where('g.grp_id IN (:...grpIds)', { grpIds })
                              .orderBy('COUNT(u1.user_id)', 'DESC')
                              .groupBy('g.grp_id')
                              .getRawMany();

    return { result, total };
  }

  /**
   * 그룹 생성 함수
   * @description 그룹당 루틴은 최소 1개 최대 3개 소유하도록 한다.
   *              1. 그룹 생성     : 유저가 그룹 소유주
   *              2. 유저 그룹 가입 : 중계 테이블 매핑
   *              3. 루틴 생성     : 그룹에 해당하는 루틴 등록
   *              4. 할일 생성     : 그룹 생성시 등록한 루틴 소유주 To-Do로 등록
   * @param createGroupDto 
   * @param routs 1 ~ 3개의 루틴 리스트
   * @returns result: 그룹 생성 성공 여부
   */
  async createGroupOne(createGroupDto: CreateGroupDto, routs: Array<any>): Promise<{ result }>{
    if(routs.length == 0){
      throw this.dwExcept.AtLeastOneRoutine;
    }

    if(routs.length > 3){
      throw this.dwExcept.ExceedMaxRoutines;
    }

    const qr = this.dataSource.createQueryRunner();

    try{
      await qr.connect();
      await qr.startTransaction();

      createGroupDto.grp_owner =  createGroupDto.user_id;
      createGroupDto.cat_id = createGroupDto.cat_id;

      // 1. 그룹 생성
      const result = await qr.manager.save(Group, createGroupDto);
      const ug = new UserGroup();

      ug.user_id = +createGroupDto.user_id;
      ug.grp_id = +result.grp_id

      // 2. 유저 그룹 가입
      const ugIns = await qr.manager.save(UserGroup ,ug);

      for(const data of routs) {
        // 3. 루틴 생성
        const rout = new Routine();

        rout.grp_id = ug.grp_id;
        rout.rout_name = data.rout_name;
        rout.rout_desc = data.rout_desc;
        rout.rout_repeat = data.rout_repeat;
        rout.rout_srt = data.rout_srt;
        rout.rout_end = data.rout_end;

        const test = await qr.manager.save(Routine, rout);

        // 4. 할일 생성
        const todo = new Todo();

        todo.grp_id = ug.grp_id;
        todo.user_id = ug.user_id;
        todo.todo_name = data.rout_name;
        todo.todo_desc = data.rout_desc;
        todo.todo_start = data.rout_srt;
        todo.todo_end = data.rout_end;
        todo.rout_id = rout.rout_id;

        await qr.manager.save(Todo, todo);
      }

      await qr.commitTransaction();
      return { result };
    } catch(err){
      await qr.rollbackTransaction();
      throw new Error(err);
    } finally {
      await qr.release();
    }
  }

  /**
   * 그룹 세부사항 조회 함수
   * @description 1. grp_detail : 그룹의 세부 정보
   *              2. rout_detail: 그룹이 갖는 루틴 정보
   *              3. grp_mems   : 그룹에 가입된 유저 정보
   * @param grp_id 
   * @returns result: description의 3가지 정보
   */
  async getGroupOne(grp_id: number): Promise<{result:{grp_detail: Group, rout_detail:Array<any>, grp_mems:Array<any>}}>{
    const grp_detail = await this.grpRepo.createQueryBuilder('g')
                                         .select([
                                           'g.grp_id    AS grp_id'
                                         , 'g.grp_name  AS grp_name'
                                         , 'g.grp_desc  AS grp_desc'
                                         , 'u.user_name AS user_name'
                                         , 'c.cat_name  AS cat_name'
                                         , 'c.cat_img   As cat_img'
                                         , `to_char(g.reg_at, 'yyyy-MM-dd HH:MI:SS') AS reg_at`
                                         ])
                                         .leftJoin('user_group', 'ug', 'g.grp_owner = ug.grp_id')
                                         .leftJoin('user'      , 'u' , 'ug.user_id = u.user_id')
                                         .leftJoin('category'  , 'c' , 'c.cat_id = g.cat_id')
                                         .where('g.grp_id = :grp_id', { grp_id })
                                         .getRawOne();

    const rout_detail = await this.grpRepo.createQueryBuilder('g')
                                          .select([
                                            'r.rout_id     AS rout_id'
                                          , 'r.rout_name   AS rout_name'
                                          , 'r.rout_desc   AS rout_desc'
                                          , 'd.rout_repeat AS rout_repeat'
                                          , 'd.days        AS days'
                                          ])
                                          .leftJoin('routine', 'r', 'g.grp_id = r.grp_id')
                                          .leftJoin('days'   , 'd', 'r.rout_repeat = d.rout_repeat')
                                          .where('g.grp_id = :grp_id', { grp_id })
                                          .getRawMany();
    
    const grp_mems = await this.grpRepo.createQueryBuilder('g')
                                       .select([
                                         'u.user_id    AS user_id'
                                       , 'u.user_name  AS user_name'
                                       , 'u.last_login AS last_login'
                                       ])
                                       .leftJoin('user_group', 'ug', 'g.grp_id = ug.grp_id')
                                       .innerJoin('user'     , 'u' , 'u.user_id = ug.user_id')
                                       .where('g.grp_id = :grp_id', { grp_id })
                                       .getRawMany();

    return { result: { grp_detail, rout_detail, grp_mems }};
  }

  /**
   * 내가 가입한 모든 그룹 조회 함수
   * @description 1. 내가 속한 모든 그룹과 그룹원들의 수
   *              2. 내가 속한 모든 그룹에대한 정보 리스트
   * @param user_id 
   * @param pagingOptions 페이징 처리할 때 queryString에서 page와 보여질 개수 인자 값
   * @returns result: 그룹 리스트(페이징)
   *          total : 총 리스트 개수
   */
  async getAllMyGroups(
      user_id: number
    , pagingOptions: { page: number; limit: number }
  ): Promise<Promise<{result: Group[], total: number}>>{
    const { page, limit } = pagingOptions;
    const qr = this.dataSource.createQueryRunner();

    try{
      // 1. 내가 속한 그룹 리스트
      const myGrps = await qr.manager.createQueryBuilder()
                                     .select([
                                       'ug1.grp_id AS grp_id'
                                     , 'COUNT(*)   AS mem_cnt'
                                     ])
                                     .from('user_group', 'ug1')
                                     .leftJoin('user_group', 'ug2', 'ug1.grp_id = ug2.grp_id')
                                     .where('ug1.user_id = :user_id', { user_id })
                                     .groupBy('ug1.grp_id')
                                     .getQuery();
      // 2. 내가 속한 그룹의 리스트 + 세부정보
      const result = await this.grpRepo.createQueryBuilder('g')
                                       .select([
                                         'g.grp_id    AS grp_id'
                                       , 'g.grp_name  AS grp_name'
                                       , 'g.grp_desc  AS grp_desc'
                                       , 'u.user_name AS owner'
                                       , 'g.cat_id    AS cat_id'
                                       , 'c.cat_name  AS cat_name'
                                       , 'c.cat_img   AS cat_img'
                                       , 'sub.mem_cnt AS mem_cnt'
                                       ])
                                       .leftJoin('user'        , 'u'  , 'g.grp_owner = u.user_id')
                                       .leftJoin('category'    , 'c'  , 'g.cat_id = c.cat_id')
                                       .innerJoin(`(${myGrps})`, 'sub', 'g.grp_id = sub.grp_id')
                                       .orderBy('sub.mem_cnt', 'DESC')
                                       .setParameter('user_id', user_id)
                                       .getRawMany();

      return { result, total: result.length };
    } catch(err){
      throw new Error(err);
    } finally {
      await qr.release();
    }
  }

  /**
   * 유저가 그룹 가입하는 함수
   * @description 1. 유저가 그룹에 가입
   *              2. 그룹이 갖는 루틴을 기반으로 유저 To-Do 생성
   * @param grp_id 가입 하려는 그룹
   * @param user_id 가입 하려는 유저
   * @returns result: 유저가 그룹에 등록 여부
   */
  async JoinGroup(grp_id: number, user_id: number): Promise<any>{
    const qr = this.dataSource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();

    try{
      const result = await qr.manager.save(UserGroup, { user_id, grp_id });
      const routs = await this.grpRepo.createQueryBuilder('g')
                                      .leftJoin('routine', 'r', 'g.grp_id = r.grp_id')
                                      .select([
                                        'r.rout_id   AS rout_id'
                                      , 'r.rout_name AS todo_name'
                                      , 'r.rout_desc AS todo_desc'
                                      , 'g.cat_id    AS todo_label'
                                      , 'r.rout_srt  AS todo_start'
                                      , 'r.rout_end  AS todo_end'
                                      ])
                                      .where({ grp_id })
                                      .getRawMany();
      
      for(const rout of routs){
        const todo = new Todo();

        todo.rout_id = rout.rout_id;
        todo.user_id = user_id;
        todo.grp_id = grp_id;
        todo.todo_name = rout.todo_name;
        todo.todo_desc = rout.todo_desc;
        todo.todo_label = rout.todo_label;
        todo.todo_start = rout.todo_start;
        todo.todo_end = rout.todo_end;

        await qr.manager.save(Todo, todo);
      }

      await qr.commitTransaction();
      return { result };
    } catch(err){
      await qr.rollbackTransaction();
      throw new Error(err);
    } finally {
      await qr.release();
    }
  }
  
  /**
   * 유저가 그룹을 나갈 때 함수
   * @description 1. 유저가 그룹에서 탈퇴
   *              2. 유저의 To-Do에서 그룹을 통해 생성된 To-Do 제거
   *              3. 그룹에 남은 인원이 없다면 그룹 삭제
   *              4. 가입 시기가 가장 오래된 사람이 그룹장이 된다. - 3번이 미수행된 경우
   *              5. 그룹에 해당하는 루틴 삭제 - 3번이 수행된 경우
   * @param grp_id 나갈 그룹
   * @param user_id 나가는 유저
   * @returns 
   */
  async leftGroup(grp_id: number, user_id: number): Promise<any>{
    const qr = this.dataSource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();

    try{
      // 1. 그룹 탈퇴
      const result = await qr.manager.delete(UserGroup, { user_id, grp_id });
      // 2. 유저의 To-Do에서 그룹 루틴 당일 날짜 삭제
      await qr.manager.update(
          Todo
        , { 
            user_id
          , grp_id
          , todo_date: Raw(todo_date => `to_char(${todo_date}, 'yyyyMMdd') = to_char(now(), 'yyyyMMdd')`)
        }
        , { todo_deleted: true }
      );

      // 그룹에 남은 인원
      const leftCnt = await qr.manager.createQueryBuilder()
                                      .select(['COUNT(*) AS cnt'])
                                      .from('group', 'g')
                                      .leftJoin('user_group', 'ug', 'g.grp_id = ug.grp_id')
                                      .where('ug.grp_id = :grp_id', { grp_id })
                                      .getRawOne();

      // 3. 그룹 인원이 0명이면 그룹 삭제
      const grpDel = await this.grpRepo.createQueryBuilder('g')
                                       .softDelete()
                                       .where('grp_id = :grp_id', { grp_id })
                                       .andWhere(`0 = :cnt`, { cnt: leftCnt.cnt })
                                       .setParameter('grp_id', grp_id)
                                       .execute();

      if(grpDel.affected === 0){
        // 4. 가입 시기가 가장 오래된 1사람
        const newOwner = await qr.manager.createQueryBuilder()
                                         .from('user_group', 'ug')
                                         .where('ug.grp_id = :grp_id', { grp_id })
                                         .orderBy('ug.reg_at')
                                         .limit(1)
                                         .getRawOne();
        // 4. 그룹장 등록
        await this.grpRepo.createQueryBuilder('g')
                          .update()
                          .set({ grp_owner: newOwner.user_id })
                          .where({ grp_id })
                          .execute();
      } else {
        // 5. 그룹 삭제가 되었으니 그에 맞는 루틴도 삭제
        await qr.manager.createQueryBuilder()
                        .softDelete()
                        .from('routine')
                        .where('grp_id = :grp_id', { grp_id })
                        .execute();
      }

      await qr.commitTransaction();
      return { result };
    } catch(err) {
      await qr.rollbackTransaction();
      throw new Error(err);
    } finally {
      await qr.release();
    }
  }

  /**
   * 그룹내의 멤버들의 루틴 인증 사진을 조회하는 함수
   * @param grp_id
   * @param rout_id 
   * @returns 
   */
  async getMemberTodoInGroup(grp_id: number, rout_id: number): Promise<{ result, path}>{
    const result = await this.grpRepo.createQueryBuilder('g')
                                     .select([
                                       't.user_id   AS user_id'
                                     , 't.todo_img  AS todo_img'
                                     , 't.todo_done AS todo_done'
                                     , 'u.user_name AS user_name'
                                     ])
                                     .leftJoin('todo'   , 't', 't.grp_id = g.grp_id')
                                     .leftJoin('routine', 'r', 't.grp_id = r.grp_id AND t.rout_id = r.rout_id')
                                     .innerJoin('user'   , 'u', 'u.user_id = t.user_id')
                                     .where('t.todo_img IS NOT NULL')
                                     .andWhere('g.grp_id = :grp_id', { grp_id })
                                     .andWhere('r.rout_id = :rout_id', { rout_id })
                                     .orderBy('t.todo_id')
                                     .getRawMany();

    return { result, path: process.env.IMAGE_PATH } ;
  }

  /**
   * 키워드와 카테고리에 따라서 검색하는 함수
   * @param user_id 
   * @param cat_id 
   * @param keyword 
   * @param pagingOptions 
   * @returns 
   */
  async getGroupsBySearching(
      user_id: number
    , cat_id: number
    , keyword: string
    , pagingOptions: { page: number; limit: number }
  ): Promise<{ result: Group[], total: number}>{
    const { page, limit } = pagingOptions;
    // 내가 가입한 그룹 리스트
    const myGrps = await this.grpRepo.createQueryBuilder('g')
                                     .leftJoin('user_group', 'ug', 'g.grp_id = ug.grp_id')
                                     .select(['g.grp_id AS grp_id'])
                                     .where('ug.user_id = :user_id', { user_id })
                                     .getRawMany();
    const myGrpsIds = myGrps.map(data => data.grp_id);
    // 전체 그룹 리스트
    const query = await this.grpRepo.createQueryBuilder('g')
                                    .leftJoin('category'  , 'c' , 'g.cat_id = c.cat_id')
                                    .leftJoin('user_group', 'ug', 'g.grp_id = ug.grp_id')
                                    .leftJoin('user'      , 'u1', 'ug.user_id = u1.user_id')
                                    .innerJoin('user'     , 'u2', 'g.grp_owner = u2.user_id')
                                    .where('1 = 1')
                                    .groupBy('g.grp_id');

    // 내가 가입한 그룹이 있는 경우 리스트에서 제외
    if(myGrpsIds.length > 0){
      query.andWhere('g.grp_id NOT IN (:...myGrpsIds)', { myGrpsIds });
    }

    // 그룹 카테고리가 전체인 경우 (0: 전체)
    if(cat_id != 0){
      query.andWhere('c.cat_id = :cat_id', { cat_id });
    }

    // 키워드를 입력한 경우 키워드에 따른 검색
    if(keyword){
      query.andWhere('(g.grp_name LIKE :keyword OR u2.user_name LIKE :keyword)', { keyword : `%${keyword}%` });
    }

    const [ items, total ] = await applyPaging(query, page, limit);
    const grpIds = getIdsFromItems(items, "grp_id");
    const result = await query.select([
                                'g.grp_id          AS grp_id'
                              , 'g.grp_name        AS grp_name' 
                              , 'g.grp_desc        AS grp_desc' 
                              , 'max(c.cat_id)     AS cat_id'
                              , 'max(c.cat_name)   AS cat_name'
                              , 'max(c.cat_img)    AS cat_img'
                              , 'max(u2.user_name) AS owner'
                              , 'count(u1.user_id) AS mem_cnt'
                              ])
                              .andWhere('g.grp_id IN (:...grpIds)', { grpIds })
                              .orderBy('count(u1.user_id)', 'DESC')
                              .getRawMany();

    return { result, total };
  }

  /**
   * 그룹 인증 사진 업로드 (할 일 페이지)
   * @description 
   * @param todo_id 
   * @param user_id 
   * @param file 
   * @returns 
   */
  async updateImageFromTodo(todo_id: number, user_id: number, file: Express.Multer.File): Promise<any>{
    if(!file){
      throw this.dwExcept.ThereIsNoFile;
    }

    const qr = this.dataSource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();
                                        
    try {
      const result = await this.compressFile(todo_id, user_id, file);

      await qr.commitTransaction();
      return { result };
    } catch(err) {
      await qr.rollbackTransaction();
      throw new Error(err);
    } finally {
      await qr.release();
    }
  }

  /**
   * 그룹 인증 사진 업로드 (그룹 세부정보 페이지)
   * @description 
   * @param rout_id 
   * @param user_id 
   * @param file 
   * @returns 
   */
  async updateImageFromGroup(rout_id: number, user_id: number, file: Express.Multer.File): Promise<any>{
    if(!file){
      throw this.dwExcept.ThereIsNoFile;
    }

    const qr = this.dataSource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();
                                        
    try {
      const todo_id = await this.todoRepo.createQueryBuilder('t')
                                         .select(['todo_id AS todo_id'])
                                         .where(`to_char(now(), 'yyyyMMdd') = to_char(todo_date, 'yyyyMMdd')`)
                                         .andWhere({ user_id, rout_id })
                                         .getRawOne();
      const result = await this.compressFile(todo_id.todo_id, user_id, file);

      await qr.commitTransaction();
      return { result };
    } catch(err) {
      await qr.rollbackTransaction();
      throw new Error(err);
    } finally {
      await qr.release();
    }
  }

  /**
   * 그룹 인증 사진 압축 및 업로드 함수
   * @description 1. 사진 압축
   *              2. 기존 파일 삭제
   *              3. DB에 사진 데이터 삽입
   * @param rout_id 
   * @param user_id 
   * @param file 
   * @returns 
   */
  async compressFile(todo_id: number, user_id:number, file: Express.Multer.File){
    if(!file){
      throw this.dwExcept.ThereIsNoFile;
    }

    try {
      const filePath = file.path;
      const ext = path.extname(file.originalname);
      const name = path.basename(file.originalname, ext);
      const fileName = `${name}_${Date.now()}${ext}`;
      const newPath = `${process.env.IMAGE_PATH}${fileName}`;

      // 1. 사진 압축(sharp 라이브러리 사용)
      await sharp(filePath).resize({ width: 1300, height: 1000, fit: 'contain' })
                           .toFile(newPath, async(err, info) => {
                             // 1. 원본 파일 삭제
                             await fs.unlink(filePath);
                           });

      const oldFile = await this.todoRepo.createQueryBuilder('t')
                                         .select(['t.todo_img AS todo_img'])
                                         .where({ todo_id })
                                         .andWhere({ user_id })
                                         .getRawOne();

      // 2. 인증을 위해서 기존에 저장한 사진은 삭제
      if(oldFile && oldFile.todo_img){
        await fs.unlink(`${process.env.IMAGE_PATH}${oldFile.todo_img}`);
      }

      // 3. 새로운 사진 업데이트
      const result = await this.todoRepo.createQueryBuilder('t')
                                        .update({ todo_img: fileName })
                                        .where({ todo_id })
                                        .andWhere({ user_id })
                                        .execute();

      return result;
    } catch(err) {
      throw new Error(err);
    }
  }

  /**
   * To-Do 할일 done 체크
   * @description 1. To-Do done 체크
   *              2. 리워드 제공
   *              3. 펫 진화
   *              4. (if 진화) 룸과 인벤토리에 펫 제공
   * @param todo_id 
   * @returns 
   */
  async updateTodoDone(todo_id: number): Promise<void>{
    const qr = this.dataSource.createQueryRunner();
    
    await qr.connect();
    await qr.startTransaction();

    try{
      // 1. To-Do done 체크
      const uptRes = await qr.manager.createQueryBuilder()
                                     .update(Todo)
                                     .set({ todo_done: true })
                                     .where({ todo_id })
                                     .andWhere('todo_done = false')
                                     .execute();

      if (uptRes.affected === 0) {
        throw this.dwExcept.NoData;
      }

      // 1. 체크한 To-Do가 오늘이 아닌 이미 지난 날짜인 경우 종료
      const isToday = await this.todoRepo.createQueryBuilder('t')
                                         .where(`to_char(now(), 'yyyyMMdd') = to_char(todo_date, 'yyyyMMdd')`)
                                         .andWhere({ todo_id })
                                         .getRawOne();
      if(!isToday){
        await qr.commitTransaction();
        return;
      }

      // 앞으로 필요한 user_id를 todo_id를 통해서 조회
      const { user_id } = await this.todoRepo.createQueryBuilder()
                                             .select(['user_id AS user_id'])
                                             .where({ todo_id })
                                             .getRawOne();

      // 2. 리워드 제공 - 추가되야할 캐시 계산
      const reward = await this.todoRepo.createQueryBuilder()
                                        .select(`case when count(*) = 1
                                                      then ${Reward.FIRST_TODO_REWARD}
                                                      else ${Reward.GROUP_TODO_REWARD}
                                                  end as reward`)
                                        .where({ user_id, todo_id })
                                        .andWhere(`to_char(now(), 'yyyyMMdd') = to_char(todo_date, 'yyyyMMdd')`)
                                        .andWhere('todo_done = true')
                                        .getRawOne();

      // 2. 리워드 제공 - 캐시(오늘 처음: 100, 그 외: 25)
      await qr.manager.createQueryBuilder()
                      .update('user')
                      .set({
                        user_cash: () => `user_cash + ${reward.reward}`
                      })
                      .where('user_id = :user_id', { user_id })
                      .execute();

      // 현재 유저가 키우는 펫 아이디 가져오기
      const { item_id } = await qr.manager.createQueryBuilder()
                                          .select(['r.item_id AS item_id'])
                                          .from('room', 'r')
                                          .leftJoin('item_shop', 'ish', 'r.item_id = ish.item_id')
                                          .where('r.user_id = :user_id', { user_id })
                                          .andWhere('ish.type_id = 1')
                                          .getRawOne();

      // 2. 리워드 - 경험치
      await qr.manager.createQueryBuilder()
                      .update('item_inventory')
                      .set({ pet_exp: () => `pet_exp + ${Reward.PET_EXP_REWARD}` })
                      .where({ user_id, item_id })
                      .execute(); 

      // 진화표
      const evol_map = await qr.manager.createQueryBuilder()
                                       .select([
                                         'ish1.item_id 	     AS cur_id'
                                       , 'ish1.item_name	   AS cur_name'
                                       , 'ish1.item_cost / 3 AS evol_exp'
                                       , 'ish2.item_id		   AS next_id'
                                       , 'ish2.item_name	   AS next_name'
                                       ])
                                       .from('item_shop', 'ish1')
                                       .leftJoin('item_shop', 'ish2', 'ish1.next_step = ish2.item_id')
                                       .where('ish1.type_id = 1')
                                       .getQuery();

      // 3. 현재 펫이 진화가 가능한 상황인지 조회
      const next_id = await qr.manager.createQueryBuilder()
                                      .select(['ish.next_id AS next_id'])
                                      .from('item_inventory', 'iv')
                                      .innerJoin(`(${ evol_map })`, 'ish', 'iv.item_id = ish.cur_id')
                                      .where('iv.user_id = :user_id', { user_id })
                                      .andWhere('ish.next_id IS NOT NULL')
                                      .andWhere('iv.pet_exp >= ish.evol_exp')
                                      .getRawOne();

      if(!next_id){
        await qr.commitTransaction();
        return;
      }

      // 4. 인벤토리에 진화된 펫 제공 - 기존 진화 전 펫을 변경
      await qr.manager.createQueryBuilder()
                      .update('item_inventory')
                      .set({
                        item_id: () => next_id.next_id
                      , pet_exp: 0 
                      })
                      .where({ user_id, item_id })
                      .execute();

      // 4. 마이룸에 진화된 펫 제공 - 기존 진화 전 펫을 변경
      await qr.manager.createQueryBuilder()
                      .update('room')
                      .set({
                        user_id
                      , item_id: next_id.next_id
                      })
                      .where({ user_id, item_id })
                      .execute();
      
      await qr.commitTransaction();
    } catch (err) {
      await qr.rollbackTransaction();
      throw new Error(err);
    } finally {
      await qr.release();
    }
  }
    
  /**
   * 그룹 삭제 함수
   * @param grp_id 
   * @returns 
   */
  async deleteGroup(grp_id: number): Promise<any>{
    const result = await this.grpRepo.softDelete({grp_id}); 
    
    return { result };
  }

  async findUsersByGroupId(groupId: number): Promise<User[]> {
    const group = await this.grpRepo.findOne({
      where: { grp_id: groupId },
      relations: ['users'],
    });

    return group ? group.users : [];
  }
}