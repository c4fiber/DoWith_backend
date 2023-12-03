import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Group } from './entities/group.entity';
import { DataSource, QueryRunner, Raw, Repository } from 'typeorm';
import { CreateGroupDto } from './dto/create-group.dto';
import { UserGroup } from 'src/user_group/entities/user_group.entity';
import { Todo } from 'src/todo/todo.entity';
import { DoWithExceptions } from 'src/do-with-exception/do-with-exception';
import { Routine } from 'src/routine/entities/routine.entity';
import * as sharp from 'sharp';
import * as fs from 'fs/promises';
import * as path from 'path';

import { applyPaging, getIdsFromItems } from 'src/utils/paging/PagingOptions';
import { Room } from 'src/room/entities/room.entity';
import { User } from 'src/user/user.entities';
import { ItemInventory } from 'src/item-inventory/entities/item-inventory.entity';
import { ItemShop } from 'src/item-shop/entities/item-shop.entity';

// TODO: item-inventory.service.ts 와 공유
enum PetLevel  {
    lv1 = '01',
    lv2 = '02',
    lv3 = '03',
}

@Injectable()
export class GroupService {
  constructor(
    @InjectRepository(Group)
    private readonly groupRepository: Repository<Group>,
    @InjectRepository(Todo)
    private readonly todoRepository: Repository<Todo>,
    private readonly doWithException: DoWithExceptions,
    private dataSource: DataSource,
  ) {}

  FIRST_TODO_REWARD: number = 100;
  GROUP_TODO_REWARD: number = 25;
  PET_EXP_REWARD: number = 10;

  PET_LV1_EXP: number = 1000;
  PET_LV2_EXP: number = 2000;

  async getGroupAll(pagingOptions: {
    page: number;
    limit: number;
  }): Promise<{ result: Group[]; total: number }> {
    const { page, limit } = pagingOptions;
    const query = await this.groupRepository
      .createQueryBuilder('g')
      .leftJoin('user_group', 'ug', 'g.grp_id = ug.grp_id')
      .leftJoin('user', 'u1', 'ug.user_id = u1.user_id')
      .leftJoin('user', 'u2', 'g.grp_owner = u2.user_id');
    const [items, total] = await applyPaging(query, page, limit);
    const grpIds = getIdsFromItems(items, 'grp_id');

    const result = await query
      .select([
        'g.grp_id               AS grp_id',
        'g.grp_name             AS grp_name',
        'MAX(u2.user_name)      AS owner',
        'COUNT(u1.user_id)::int AS mem_cnt',
      ])
      .where('g.grp_id IN (:...grpIds)', { grpIds })
      .orderBy('COUNT(u1.user_id)', 'DESC')
      .groupBy('g.grp_id')
      .getRawMany();

    return { result, total };
  }

  async createGroupOne(
    createGroupDto: CreateGroupDto,
    routs: Array<any>,
  ): Promise<any> {
    if (routs.length == 0) {
      throw this.doWithException.AtLeastOneRoutine;
    }

    if (routs.length > 3) {
      throw this.doWithException.ExceedMaxRoutines;
    }

    const queryRunner = this.dataSource.createQueryRunner();

    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();

      createGroupDto.grp_owner = createGroupDto.user_id;
      createGroupDto['category'] = {
        cat_id: createGroupDto.cat_id,
        cat_name: 'Unreached code',
      };

      // Group Insert
      const result = await queryRunner.manager.save(Group, createGroupDto);
      const ug = new UserGroup();

      ug.user_id = +createGroupDto.user_id;
      ug.grp_id = +result.grp_id;

      // UserGroup Insert
      const ugIns = await queryRunner.manager.save(UserGroup, ug);

      // Routine Insert
      for (const data of routs) {
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
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw new Error(err);
    } finally {
      await queryRunner.release();
    }
  }

  async getGroupOne(grp_id: number): Promise<{
    result: {
      grp_detail: Group;
      rout_detail: Array<any>;
      grp_mems: Array<any>;
    };
  }> {
    const grp_detail = await this.groupRepository
      .createQueryBuilder('g')
      .select([
        'g.grp_id    AS grp_id',
        'g.grp_name  AS grp_name',
        'g.grp_decs  AS grp_desc',
        `to_char(g.reg_at, 'yyyy-MM-dd HH:MI:SS') AS reg_at`,
        'u.user_name AS user_name',
        'c.cat_name  AS cat_name',
      ])
      .leftJoin('user_group', 'ug', 'g.grp_owner = ug.grp_id')
      .leftJoin('user', 'u', 'ug.user_id = u.user_id')
      .leftJoin('category', 'c', 'c.cat_id = g.cat_id')
      .where('g.grp_id = :grp_id', { grp_id })
      .getRawOne();

    const rout_detail = await this.groupRepository
      .createQueryBuilder('g')
      .select([
        'r.rout_id   AS rout_id',
        'r.rout_name AS rout_name',
        'r.rout_desc AS rout_desc',
      ])
      .leftJoin('routine', 'r', 'g.grp_id = r.grp_id')
      .where('g.grp_id = :grp_id', { grp_id })
      .getRawMany();

    const grp_mems = await this.groupRepository
      .createQueryBuilder('g')
      .select([
        'u.user_id    AS user_id',
        'u.user_name  AS user_name',
        'u.last_login AS last_login',
      ])
      .leftJoin('user_group', 'ug', 'g.grp_id = ug.grp_id')
      .leftJoin('user', 'u', 'u.user_id = ug.user_id')
      .where('g.grp_id = :grp_id', { grp_id })
      .getRawMany();

    return { result: { grp_detail, rout_detail, grp_mems } };
  }

  async getAllMyGroups(
    user_id: number,
    pagingOptions: { page: number; limit: number },
  ): Promise<Promise<{ result: Group[]; total: number }>> {
    const { page, limit } = pagingOptions;
    const Count = await this.groupRepository
      .createQueryBuilder('g')
      .select(['g.grp_id AS grp_id', 'count(*) AS mem_cnt'])
      .leftJoin('user_group', 'ug', 'g.grp_id = ug.grp_id')
      .leftJoin('user', 'u', 'ug.user_id = u.user_id')
      .groupBy('g.grp_id')
      .getQuery();

    const query = await this.groupRepository
      .createQueryBuilder('g')
      .leftJoin('user_group', 'ug', 'g.grp_id = ug.grp_id')
      .leftJoin('user', 'u1', 'ug.user_id = u1.user_id')
      .leftJoin('user', 'u2', 'g.grp_owner = u2.user_id')
      .leftJoin('category', 'c', 'g.cat_id = c.cat_id')
      .leftJoin(`(${Count})`, 'g2', 'g.grp_id = g2.grp_id')
      .where('u1.user_id = :user_id', { user_id });

    const [items, total] = await applyPaging(query, page, limit);
    const grpIds = getIdsFromItems(items, 'grp_id');
    const result = await query
      .select([
        'g.grp_id          AS grp_id',
        'g.grp_name        AS grp_name',
        'g.grp_decs        AS grp_decs',
        'MAX(u2.user_name) AS owner',
        'g.cat_id          AS cat_id',
        'MAX(c.cat_name)   AS cat_name',
        'MAX(g2.mem_cnt)   AS mem_cnt',
      ])
      .andWhere('g.grp_id IN (:...grpIds)', { grpIds })
      .groupBy('g.grp_id')
      .orderBy('MAX(g2.mem_cnt)', 'DESC')
      .getRawMany();

    return { result, total };
  }

  async JoinGroup(grp_id: number, user_id: number): Promise<any> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const result = await queryRunner.manager.save(UserGroup, {
        user_id,
        grp_id,
      });
      const routs = await this.groupRepository
        .createQueryBuilder('g')
        .leftJoin('routine', 'r', 'g.grp_id = r.grp_id')
        .select([
          'r.rout_name AS todo_name',
          'r.rout_desc AS todo_desc',
          'g.cat_id    AS todo_label',
          'r.rout_srt  AS todo_start',
          'r.rout_end  AS todo_end',
        ])
        .where({ grp_id })
        .getRawMany();

      for (const rout of routs) {
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
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw new Error(err);
    } finally {
      await queryRunner.release();
    }
  }

  async leftGroup(grp_id: number, user_id: number): Promise<any> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 유저 그룹에서 탈퇴
      const result = await queryRunner.manager.delete(UserGroup, {
        user_id,
        grp_id,
      });
      // 유저의 To-Do에서 그룹 루틴 삭제
      await queryRunner.manager.update(
        Todo,
        {
          user_id,
          grp_id,
          todo_date: Raw(
            (todo_date) =>
              `to_char(${todo_date}, 'yyyyMMdd') = to_char(now(), 'yyyyMMdd')`,
          ),
        },
        { todo_deleted: true },
      );

      // 그룹에 남은 인원
      const leftCnt = await queryRunner.manager
        .createQueryBuilder()
        .from('group', 'g')
        .leftJoin('user_group', 'ug', 'g.grp_id = ug.grp_id')
        .where('ug.grp_id = :grp_id', { grp_id })
        .getCount();
      // 그룹 루틴 삭제
      await queryRunner.manager
        .createQueryBuilder()
        .delete()
        .from('routine')
        .where('grp_id = :grp_id', { grp_id })
        .execute();
      // 그룹 인원이 0명이면 그룹 삭제
      const grpDel = await this.groupRepository
        .createQueryBuilder('g')
        .softDelete()
        .where('grp_id = :grp_id', { grp_id })
        .andWhere(`0 = :leftCnt`, { leftCnt })
        .setParameter('grp_id', grp_id)
        .execute();
      // 그룹장 탈퇴시 다른 그룹원이 그룹장이 되도록 설정
      if (grpDel.affected === 0) {
        // 가입 시기가 가장 오래된 1사람
        const newOwner = await queryRunner.manager
          .createQueryBuilder()
          .from('user_group', 'ug')
          .where('ug.grp_id = :grp_id', { grp_id })
          .orderBy('ug.reg_at')
          .limit(1)
          .getRawOne();
        // 새로운 그룹장 등록
        await this.groupRepository
          .createQueryBuilder('g')
          .update()
          .set({ grp_owner: newOwner.user_id })
          .where({ grp_id })
          .execute();
      }
      await queryRunner.commitTransaction();

      return { result };
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw new Error(err);
    } finally {
      await queryRunner.release();
    }
  }

  async getMemberTodoInGroup(grp_id: number, rout_id: number): Promise<any> {
    const result = await this.groupRepository
      .createQueryBuilder('g')
      .select([
        't.user_id   AS user_id',
        't.todo_img  AS todo_img',
        't.todo_done AS todo_done',
        'u.user_name AS user_name',
      ])
      .leftJoin('todo', 't', 't.grp_id = g.grp_id')
      .leftJoin('routine', 'r', 't.grp_id = r.grp_id AND t.rout_id = r.rout_id')
      .leftJoin('user', 'u', 'u.user_id = t.user_id')
      .where('t.todo_img IS NOT NULL')
      .andWhere('g.grp_id = :grp_id', { grp_id })
      .andWhere('r.rout_id = :rout_id', { rout_id })
      .orderBy('t.todo_id')
      .getRawMany();

    return { result, path: process.env.IMAGE_PATH };
  }

  async getGroupsBySearching(
    user_id: number,
    cat_id: number,
    keyword: string,
    pagingOptions: { page: number; limit: number },
  ): Promise<{ result: Group[]; total: number }> {
    const { page, limit } = pagingOptions;
    const myGrps = await this.groupRepository
      .createQueryBuilder('g')
      .leftJoin('user_group', 'ug', 'g.grp_id = ug.grp_id')
      .select(['g.grp_id AS grp_id'])
      .where('ug.user_id = :user_id', { user_id })
      .getRawMany();
    const myGrpsIds = myGrps.map((data) => data.grp_id);
    const query = await this.groupRepository
      .createQueryBuilder('g')
      .leftJoin('category', 'c', 'g.cat_id = c.cat_id')
      .leftJoin('user_group', 'ug', 'g.grp_id = ug.grp_id')
      .leftJoin('user', 'u1', 'ug.user_id = u1.user_id')
      .leftJoin('user', 'u2', 'g.grp_owner = u2.user_id')
      .where('1 = 1')
      .groupBy('g.grp_id');

    if (myGrpsIds.length > 0) {
      query.andWhere('g.grp_id NOT IN (:...myGrpsIds)', { myGrpsIds });
    }

    if (cat_id != 1) {
      // 1: 전체
      query.andWhere('c.cat_id = :cat_id', { cat_id });
    }

    if (keyword) {
      query.andWhere(
        '(g.grp_name LIKE :keyword OR u2.user_name LIKE :keyword)',
        { keyword: `%${keyword}%` },
      );
    }

    const [items, total] = await applyPaging(query, page, limit);
    const grpIds = getIdsFromItems(items, 'grp_id');
    const result = await query
      .select([
        'g.grp_id          AS grp_id',
        'g.grp_name        AS grp_name',
        'g.grp_decs        AS grp_decs',
        'max(c.cat_id)     AS cat_id',
        'max(c.cat_name)   AS cat_name',
        'max(u2.user_name) AS owner',
        'count(u1.user_id) AS mem_cnt',
      ])
      .andWhere('g.grp_id IN (:...grpIds)', { grpIds })
      .orderBy('count(u1.user_id)', 'DESC')
      .getRawMany();

    return { result, total };
  }

  async updateImage(
    todo_id: number,
    user_id: number,
    file: Express.Multer.File,
  ): Promise<any> {
    if (!file) {
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

      await sharp(filePath)
        .resize({ width: 1000, height: 1000, fit: 'contain' })
        .toFile(newPath, async (err, info) => {
          await fs.unlink(filePath); // 업로드한 원본 파일 삭제
        });

      const oldFile = await this.todoRepository
        .createQueryBuilder('t')
        .select(['t.todo_img AS todo_img'])
        .where({ todo_id })
        .andWhere({ user_id })
        .getRawOne();

      if (oldFile.todo_img) {
        await fs.unlink(oldFile.todo_img); // 기존에 저장했던 인증 사진 삭제(새로운 사진 업로드 했으니까)
      }

      const result = await this.todoRepository
        .createQueryBuilder('t')
        .update({ todo_img: newPath })
        .where({ todo_id })
        .andWhere({ user_id })
        .execute();

      await queryRunner.commitTransaction();
      return { result };
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw new Error(err);
    } finally {
      await queryRunner.release();
    }
  }

  async updateTodoDone(todo_id: number): Promise<any> {
    const today: Date = new Date();

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      // 1. 투두 업데이트
      const updatedTodo = await queryRunner.manager
        .createQueryBuilder()
        .update(Todo)
        .set({
          todo_done: true,
        })
        .where({ todo_id })
        .execute();

      if (updatedTodo.affected === 0) {
        // 투두가 없음
        Logger.log('Todo data does not exist');
        throw this.doWithException.NoData;
      }

      // 2. 투두 관련 리워드 계산 & 유저 업데이트
      // 투두 시간 가져오기
      const todo = await this.getTodoDateAndUserId(queryRunner, todo_id);
      if (todo === null) {
        // 투두가 없음
        throw this.doWithException.NoData;
      }

      const {todo_date, user_id} = todo;

      // 지난 날짜 투두는 제외
      if (this.isPastTodo(todo_date)) {
        const result = await queryRunner.manager
          .createQueryBuilder(Todo, 't')
          .leftJoin('user', 'u', 'u.user_id = t.user_id')
          .select([
            'u.user_id as user_id',
            'u.user_cash as user_cash',
            't.todo_id as todo_id',
            't.todo_done as todo_done',
          ])
          .where('t.todo_id = :todo_id', { todo_id })
          .getRawOne();

        return { result };
      }

      // 기존 오늘 완료된 투두 개수
      const todayDoneCnt = await this.todoRepository
        .createQueryBuilder('todo')
        .where('user_id = :user_id', { user_id })
        .andWhere('DATE(todo.todo_date) = DATE(:today)', { today })
        .andWhere('todo_done = true')
        .getCount();

      const cash = this.calculateCash(true, todayDoneCnt);
      const userUpdated = await queryRunner.manager
        .createQueryBuilder()
        .update(User)
        .set({
          user_cash: () => 'user_cash + :cash',
        })
        .where('user_id = :id', { id: user_id, cash: cash })
        .execute();

      if (userUpdated.affected === 0) {
        Logger.log('User data does not exist');
        throw this.doWithException.NoData;
      }

      // 2. 그룹인 경우 메인으로 설정된 유저 펫 경험치 업데이트
      const main_pet = await this.getUserMainPet(queryRunner, user_id);
      if (main_pet == null) {
        // 펫이 존재하지 않음
        throw this.doWithException.NoData;
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

      const updateExp = await queryRunner.manager
        .createQueryBuilder()
        .update(ItemInventory)
        .set({
          pet_exp: () => 'pet_exp + :exp',
        })
        .where('user_id = :user_id', { user_id: user_id, exp: petExp })
        .andWhere({ item_id })
        .execute();

      if (updateExp.affected === 0) {
        Logger.log('Pet data does not exist');
        throw this.doWithException.NoData;
      }

      // 3. 펫 진화가 필요한 경우 진화
      const [pet_type, pet_level] = item_name.split('_');

      if (
        (pet_level === PetLevel.lv1 && pet_exp >= this.PET_LV1_EXP) ||
        (pet_level === PetLevel.lv2 && pet_exp >= this.PET_LV2_EXP)
      ) {
        // 펫 진화 부분
        const next_pet_name = `${pet_type}_0${parseInt(pet_level) + 1}`;
        const next_pet: ItemShop = await this.dataSource
          .createQueryBuilder(ItemShop, 'ish')
          .select()
          .where('item_name = :item_name', { item_name: next_pet_name })
          .getOne();

        if (next_pet == null) {
          throw this.doWithException.NoData;
        }

        pet_item_id = next_pet.item_id; // 진화된 경우

        // 인벤토리에 새 펫 배치
        await this.dataSource
          .createQueryBuilder()
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
        await this.dataSource
          .createQueryBuilder(Room, 'r')
          .delete()
          .where('user_id = :user_id', { user_id })
          .andWhere('item_id = :item_id', { item_id })
          .execute();

        await this.dataSource
          .createQueryBuilder()
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
      const result = await queryRunner.manager
        .createQueryBuilder(User, 'u')
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

  async deleteGroup(grp_id: number): Promise<any> {
    const result = await this.groupRepository.softDelete({ grp_id });

    return { result };
  }

  // * ========= Helpers ========== * //

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
   * 투두 날짜 반환
   * @param queryRunner
   * @param todo_id
   * @returns null if no todo exists
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
      .leftJoin('item_shop', 'ish', 'r.item_id = ish.item_id')
      .leftJoin('item_inventory', 'iv', 'r.item_id = iv.item_id')
      .where('r.user_id = :user_id', { user_id: user_id })
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
      return this.FIRST_TODO_REWARD * (todo_done ? 1 : -1);
    }
    // 기본 캐시 계산
    return this.GROUP_TODO_REWARD * (todo_done ? 1 : -1);
  }

  /**
   * 펫 경험치 계산
   * @param todo_done
   * @returns
   */
  private calculatePetExp(todo_done: boolean) {
    return this.PET_EXP_REWARD * (todo_done ? 1 : -1);
  }
}
