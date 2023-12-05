import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Group } from '../../entities/group.entity';
import { DataSource, QueryRunner, Raw, Repository, Transaction } from 'typeorm';
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
import { Room } from 'src/entities/room.entity';
import { Reward } from 'src/enums/Reward.enum';
import { ItemInventory } from 'src/entities/item-inventory.entity';
import { PetLevel } from 'src/enums/PetLevel.enum';
import { ItemShop } from 'src/entities/item-shop.entity';

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
      createGroupDto['category'] = { cat_id: createGroupDto.cat_id, cat_name: 'Unreached code'};

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

        await qr.manager.save(Routine, rout);

        // 4. 할일 생성
        const todo = new Todo();

        todo.grp_id = ug.grp_id;
        todo.user_id = ug.user_id;
        todo.todo_name = data.rout_name;
        todo.todo_desc = data.rout_desc;
        todo.todo_start = data.rout_srt;
        todo.todo_end = data.rout_end;

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
                                         , `to_char(g.reg_at, 'yyyy-MM-dd HH:MI:SS') AS reg_at`
                                         , 'u.user_name AS user_name'
                                         , 'c.cat_name  AS cat_name'
                                         ])
                                         .leftJoin('user_group', 'ug', 'g.grp_owner = ug.grp_id')
                                         .leftJoin('user'      , 'u' , 'ug.user_id = u.user_id')
                                         .leftJoin('category'  , 'c' , 'c.cat_id = g.cat_id')
                                         .where('g.grp_id = :grp_id', { grp_id })
                                         .getRawOne();

    const rout_detail = await this.grpRepo.createQueryBuilder('g')
                                          .select([
                                            'r.rout_id   AS rout_id'
                                          , 'r.rout_name AS rout_name'
                                          , 'r.rout_desc AS rout_desc'
                                          ])
                                          .leftJoin('routine', 'r', 'g.grp_id = r.grp_id')
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
                                      .from('group', 'g')
                                      .leftJoin('user_group', 'ug', 'g.grp_id = ug.grp_id')
                                      .where('ug.grp_id = :grp_id', { grp_id })
                                      .getCount();
      // 3. 그룹 인원이 0명이면 그룹 삭제
      const grpDel = await this.grpRepo.createQueryBuilder('g')
                                       .softDelete()
                                       .where('grp_id = :grp_id', { grp_id })
                                       .andWhere(`0 = :leftCnt`, { leftCnt })
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
                                     .leftJoin('user'   , 'u', 'u.user_id = t.user_id')
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
                                    .leftJoin('user'      , 'u2', 'g.grp_owner = u2.user_id')
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
                              , 'max(u2.user_name) AS owner'
                              , 'count(u1.user_id) AS mem_cnt'
                              ])
                              .andWhere('g.grp_id IN (:...grpIds)', { grpIds })
                              .orderBy('count(u1.user_id)', 'DESC')
                              .getRawMany();

    return { result, total };
  }

  /**
   * 그룹 인증 사진 업로드
   * @description 1. 사진 압축
   *              2. 원래 저장했었던 사진 삭제
   *              3. 사진 저장
   * @param todo_id 
   * @param user_id 
   * @param file 
   * @returns 
   */
  async updateImage(todo_id: number, user_id: number, file: Express.Multer.File): Promise<any>{
    if(!file){
      throw this.dwExcept.ThereIsNoFile;
    }

    const qr = this.dataSource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();
                                        
    try {
      const filePath = file.path;
      const ext = path.extname(file.originalname);
      const name = path.basename(file.originalname, ext);
      const newPath = `${process.env.IMAGE_PATH}${name}_${Date.now()}${ext}`;

      // 1. 사진 압축(sharp 라이브러리 사용)
      await sharp(filePath).resize({ width: 1000, height: 1000, fit: 'contain' })
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
        await fs.unlink(oldFile.todo_img);
      }

      // 3. 새로운 사진 업데이트
      const result = await this.todoRepo.createQueryBuilder('t')
                                        .update({ todo_img: newPath })
                                        .where({ todo_id })
                                        .andWhere({ user_id })
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

  /**
   * 업로드한 인증 사진을 통해서 다른 그룹원의 루틴 인증 함수
   * @param todo_id 
   * @returns 
   */
  async updateTodoDone(todo_id: number): Promise<any>{

    const today: Date = new Date();

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
    // 1. 투두 업데이트
    const updatedTodo = await queryRunner.manager.createQueryBuilder()
                                                 .update(Todo)
                                                 .set({
                                                  todo_done: true,
                                                 })
                                                 .where({ todo_id })
                                                 .execute();

    if (updatedTodo.affected === 0) {
      // 투두가 없음
      throw this.dwExcept.NoData;
    }

    // 2. 투두 관련 리워드 계산 & 유저 업데이트
    // 투두 시간 가져오기
    const todo = await this.getTodoDateAndUserId(queryRunner, todo_id);
    if (todo === null) {
      // 투두가 없음
      throw this.dwExcept.NoData;
    }

    const {todo_date, user_id} = todo;

    // 지난 날짜 투두는 제외
    if (this.isPastTodo(todo_date)) {
      const result = await queryRunner.manager.createQueryBuilder(Todo, 't')
                                              .leftJoin('user', 'u', 'u.user_id = t.user_id')
                                              .select([
                                                'u.user_id as user_id',
                                                'u.user_cash as user_cash',
                                                't.todo_id as todo_id',
                                                't.todo_done as todo_done',
                                              ])
                                              .where('t.todo_id = :todo_id', { todo_id })
                                              .getRawOne();

      await queryRunner.commitTransaction();
      return { result };
    }

    // 기존 오늘 완료된 투두 개수
    const todayDoneCnt = await this.todoRepo.createQueryBuilder('todo')
                                            .where('user_id = :user_id', { user_id })
                                            .andWhere('DATE(todo.todo_date) = DATE(:today)', { today })
                                            .andWhere('todo_done = true')
                                            .getCount();

    const cash = this.calculateCash(true, todayDoneCnt);
    const userUpdated = await queryRunner.manager.createQueryBuilder()
                                                  .update(User)
                                                  .set({
                                                    user_cash: () => 'user_cash + :cash',
                                                  })
                                                  .where('user_id = :id', { id: user_id, cash: cash })
                                                  .execute();

    if (userUpdated.affected === 0) {
      throw this.dwExcept.NoData;
    }

    // 2. 그룹인 경우 메인으로 설정된 유저 펫 경험치 업데이트
    const main_pet = await this.getUserMainPet(queryRunner, user_id);
    if (main_pet == null) {
      // 펫이 존재하지 않음
      throw this.dwExcept.NoData;
    }

    /**
      'ish.item_id as item_id',
      'ish.type_id as item_type',
      'ish.item_name as item_name',
      'ish.item_path as item_path',
      'iv.pet_name as pet_name',
      'iv.pet_exp as pet_exp',
    */
    const { item_id, item_name, pet_name, pet_exp } = main_pet;
    const petExp = this.calculatePetExp(true);
    let pet_item_id = item_id;

    const updateExp = await queryRunner.manager.createQueryBuilder()
                                               .update(ItemInventory)
                                               .set({
                                                pet_exp: () => 'pet_exp + :exp',
                                               })
                                               .where('user_id = :user_id', {
                                                user_id: user_id, exp: petExp
                                               })
                                               .andWhere({ item_id })
                                               .execute();

    if (updateExp.affected === 0) {
      throw this.dwExcept.NoData;
    }

    // 3. 펫 진화가 필요한 경우 진화
    const [pet_type, pet_level] = item_name.split('_');

    if ((pet_level === PetLevel.lv1 && pet_exp >= PetLevelExp.lv1) ||
        (pet_level === PetLevel.lv2 && pet_exp >= PetLevelExp.lv2)) {

        // 펫 진화
        const next_pet_name = `${pet_type}_0${parseInt(pet_level) + 1}`;
        const next_pet: ItemShop = await this.dataSource.createQueryBuilder(ItemShop, 'ish')
                                                        .select()
                                                        .where('item_name = :item_name', {
                                                          item_name: next_pet_name
                                                        })
                                                        .getOne();

        if (next_pet == null) {
          throw this.dwExcept.NoData;
        }

        pet_item_id = next_pet.item_id; // 진화된 경우

        // 인벤토리에 새 펫 배치
        await this.dataSource.createQueryBuilder()
                             .insert()
                             .into(ItemInventory)
                             .values([
                               {
                                 user_id: user_id,
                                 item_id: next_pet.item_id,
                                 pet_name: pet_name,
                                 pet_exp: 0, // 경험치는 다시 0으로
                               },
                             ])
                             .execute();

        // 메인 룸에 배치 [삭제 후 삽입]
        await this.dataSource.createQueryBuilder(Room, 'r')
                             .delete()
                             .where('user_id = :user_id', { user_id })
                             .andWhere('item_id = :item_id', { item_id })
                             .execute();

        await this.dataSource.createQueryBuilder()
                             .insert()
                             .into(Room)
                             .values([
                               {
                                 user_id: user_id,
                                 item_id: next_pet.item_id,
                               },
                             ])
                             .execute();
      }
  
      // 업데이트 결과 반환
      const result = await queryRunner.manager.createQueryBuilder(User, 'u')
                                              .leftJoin('todo', 't', 't.user_id = u.user_id')
                                              .leftJoin(
                                                'item_inventory',
                                                'iv',
                                                'iv.user_id = u.user_id AND iv.item_id = :pet_item_id',
                                              )
                                              .select([
                                                'u.user_id as user_id',
                                                'u.user_cash as user_cash',
                                                't.todo_id as todo_id',
                                                't.todo_done as todo_done',
                                                'iv.item_id as item_id',
                                                'iv.pet_exp as pet_exp',
                                              ])
                                              .where('u.user_id = :user_id', { user_id, pet_item_id })
                                              .andWhere('t.todo_id = :todo_id', { todo_id })
                                              .getRawOne();

      await queryRunner.commitTransaction();
      return { result };
      
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw new Error(error);
      
    } finally {
      await queryRunner.release();
    }
  }
    

  /**
   * 그룹 삭제 함수 (2023.12.03 사용중x)
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
  
  /**
   * 날짜가 과거인지 확인
   * @param todo_date
   * @returns
   */
  private isPastTodo(todo_date: Date): boolean {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    todo_date.setHours(0, 0, 0, 0);
    return todo_date < today;
  }

  /**
   * 투두 날짜 및 유저 아이디를 반환합니다.
   * @param queryRunner
   * @param todo_id
   * @returns
   */
  private async getTodoDateAndUserId(queryRunner: QueryRunner, todo_id: number) {
    const result = await queryRunner.manager
      .getRepository(Todo)
      .createQueryBuilder()
      .select(['todo_date', 'user_id'])
      .where({ todo_id })
      .getRawOne();

    return result;
  }

  /**
   * 유저의 Room에 있는 펫을 가져옵니다.
   * @param user_id
   * @returns
   */
  private async getUserMainPet(queryRunner: QueryRunner, user_id: number) {
    return await queryRunner.manager
      .getRepository(Room)
      .createQueryBuilder('r')
      .leftJoin('item_shop', 'ish', 'r.item_id = ish.item_id AND ish.type_id = :PET_TYPE')
      .leftJoin('item_inventory', 'iv', 'r.item_id = iv.item_id AND iv.user_id = :user_id')
      .where('r.user_id = :user_id', { user_id: user_id, PET_TYPE: 1 })
      .select([
        'ish.item_id as item_id',
        'ish.type_id as item_type',
        'ish.item_name as item_name',
        'ish.item_path as item_path',
        'iv.pet_name as pet_name',
        'iv.pet_exp as pet_exp',
      ])
      .getRawOne();
  }

  /**
   * 유저 캐시 보상 계산
   * @param todo_done
   * @param todo_date
   * @param todayDoneCnt
   * @returns
   */
  private calculateCash(todo_done: boolean, todayDoneCnt: number) {
    if (
      (todo_done && todayDoneCnt === 0) ||
      (!todo_done && todayDoneCnt === 1)
    ) {
      // 투두를 완료 체크한 경우 (첫 번째 투두 체크 또는 마지막 투두 체크해제)
      return Reward.FIRST_TODO_REWARD * (todo_done ? 1 : -1);
    }
    // 기본 캐시 계산
    return Reward.GROUP_TODO_REWARD * (todo_done ? 1 : -1);
  }

  /**
   * 펫 경험치 계산
   * @param todo_done
   * @returns
   */
  private calculatePetExp(todo_done: boolean) {
    return Reward.PET_EXP_REWARD * (todo_done ? 1 : -1);
  }
}