import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { Todo } from '../../entities/todo.entity';
import { CreateTodoDto } from './dto/create-todo.dto';
import { UpdateTodoDto } from './dto/update-todo.dto';
import { DoWithExceptions } from 'src/utils/do-with-exception/do-with-exception';
import { User } from 'src/entities/user.entities';
import { Room } from 'src/entities/room.entity';
import { ItemInventory } from 'src/entities/item-inventory.entity';

@Injectable()
export class TodoService {
  constructor(
    @InjectRepository(Todo)
    private readonly todoRepository: Repository<Todo>,
    private readonly doWithExceptions: DoWithExceptions,
    private readonly dataSource: DataSource,
  ) {}

  FIRST_TODO_REWARD: number = 100;
  NORAML_TODO_REWARD: number = 10;
  GROUP_TODO_REWARD: number = 25;
  NORMAL_TODO_DAYLIMIT: number = 10;

  PET_LV1: string = '01';
  PET_LV2: string = '02';
  PET_LV3: string = '03';
  PET_LV1_EXP: number = 1000;
  PET_LV2_EXP: number = 2000;

  // READ
  async findAllByUser(user_id: number): Promise<Todo[]> {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1); // 어제 날짜 계산

    return await this.todoRepository
      .createQueryBuilder('todo')
      .where('todo.user_id = :user_id', { user_id })
      .andWhere(
        'todo.todo_date = :today OR todo.todo_date >= :yesterday \
         AND \
         todo.todo_date < :today AND todo_done = :todo_done ',
        {
          today,
          yesterday,
          todo_done: false,
        },
      )
      .orderBy('todo.todo_date', 'ASC')
      .orderBy('todo.todo_id', 'ASC')
      .getMany();
    // return await this.todoRepository.findBy({ user_id, todo_deleted: false });
  }

  /**
   * 오늘의 To-Do 생성기 
   * @param user_id
   * @description 유저가 가입한 그룹의 루틴이 개인의 To-Do에 반영됩니다.
   *              1. 마지막 로그인 일자 갱신
   *              2. 연속 로그인 갱신
   *              3. 누적 로그인 갱신
   *              4. Routine에서 만들어지는 To-Do 생성
   * @returns 
   */
  async createTodayTodo(user_id: number){
    const queryRunner = this.dataSource.createQueryRunner();
    // 마지막 로그인 유저 정보
    const user = await queryRunner.manager
      .createQueryBuilder()
      .from('user', 'u')
      .where('u.user_id = :user_id', { user_id })
      .andWhere(
        `to_char(u.last_login, 'yyyyMMdd') = to_char(now(), 'yyyyMMdd')`,
      )
      .getRawOne();
    // 1. 마지막 로그인 일자 갱신 쿼리 (실행 x)
    const newLastLogin = queryRunner.manager
      .createQueryBuilder()
      .update('user')
      .set({ last_login: () => 'now()' })
      .where('user_id = :user_id', { user_id });
    // 이미 todo 생성했을 경우
    if (user) {
      // 1. 오늘 로그인 날짜로 최신화
      await newLastLogin.execute();
      throw this.doWithExceptions.AlreadyMadeTodos;
    }

    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();

      // 2. 연속 로그인 증가
      const result = await queryRunner.manager.createQueryBuilder()
                               .update('user')
                               .set({ login_cnt: () => '"login_cnt" + 1' })
                               .where({ user_id })
                               .execute();
      if(result.affected === 0){
        throw this.doWithExceptions.UserNotFound;  
      }
      // 3. 누적 로그인 증가
      const test = await queryRunner.manager
        .createQueryBuilder()
        .update('user')
        .set({
          login_seq:
            () => `CASE WHEN EXTRACT(DAY FROM AGE(now(), "last_login")) = 1
                                                             THEN "login_seq" + 1 
                                                             ELSE 1
                                                         END`,
        })
        .where({ user_id })
        .execute();
      // 1. 오늘 로그인 날짜로 최신화
      await newLastLogin.execute();
      // 4. todo 생성기 - 유저가 가입한 그룹 리스트
      const subQuery = await queryRunner.manager
        .createQueryBuilder()
        .select(['g.grp_id AS grp_id'])
        .from('group', 'g')
        .leftJoin('user_group', 'ug', 'g.grp_id = ug.grp_id')
        .where('ug.user_id = :user_id', { user_id })
        .getQuery();
      // 4. todo 생성기 - 가입한 그룹에서 오늘 요일에 해당하는 루틴 리스트
      const todos = await queryRunner.manager
        .createQueryBuilder()
        .select([
          `${user_id}  AS user_id`,
          'r.rout_name AS todo_name',
          'r.rout_desc AS todo_desc',
          'g.cat_id    AS todo_label',
          'r.rout_srt  AS todo_start',
          'r.rout_end  AS todo_end',
          'r.grp_id    AS grp_id',
          'r.rout_id   AS rout_id',
        ])
        .from('routine', 'r')
        .leftJoin('days', 'd', 'r.rout_repeat = d.rout_repeat')
        .leftJoin('group', 'g', 'g.grp_id = r.grp_id')
        .where(`r.grp_id IN (${subQuery})`, { user_id })
        .andWhere(`to_char(now(), 'dy') = ANY(d.days)`)
        .getRawMany();

      for (const todo of todos) {
        // 4. todo 생성기 - 루틴 리스트를 To-Do로 삽입
        const res = await queryRunner.manager
          .createQueryBuilder()
          .insert()
          .into('todo')
          .values({
            user_id: user_id,
            todo_name: todo.todo_name,
            todo_desc: todo.todo_desc,
            todo_label: todo.todo_label,
            todo_start: todo.todo_start,
            todo_end: todo.todo_end,
            grp_id: todo.grp_id,
            rout_id: todo.rout_id,
          })
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

  async findOne(todo_id: number): Promise<Todo> {
    return await this.todoRepository.findOneBy({
      todo_id,
      todo_deleted: false,
    });
  }

  async getTodayCount(user_id: number) {
    const now = new Date();
    const query = this.todoRepository
      .createQueryBuilder('todo')
      .where('user_id = :user_id', { user_id })
      .andWhere('DATE(todo.todo_date) = DATE(:today)', { today: now });

    // 기존 오늘자 투두, 오늘 완료된 투두
    const [todo_today, todo_today_done] = await Promise.all([
      query.getCount(),
      query.clone().andWhere('todo_done = true').getCount(),
    ]);

    const result = { todo_today, todo_today_done };
    Logger.log(`today: ${todo_today}, ${todo_today_done}`);
    return { result };
  }

  // CREATE
  async create(createTodoDto: CreateTodoDto): Promise<Todo> {
    const todo = new Todo();
    Object.keys(createTodoDto).forEach((key) => {
      if (createTodoDto[key] !== undefined && createTodoDto[key] !== null) {
        todo[key] = createTodoDto[key];
      }
    });

    // // todo_id, todo_deleted: default
    // todo.user_id = createTodoDto.user_id;

    // todo.todo_name = createTodoDto.todo_name;
    // todo.todo_desc = createTodoDto.todo_desc;
    // todo.todo_label = createTodoDto.todo_label;
    // todo.todo_date = createTodoDto.todo_date;
    // todo.todo_done = createTodoDto.todo_done;

    // todo.todo_start = createTodoDto.todo_start;
    // todo.todo_end = createTodoDto.todo_end;
    // todo.grp_id = createTodoDto.grp_id;
    // todo.todo_img = createTodoDto.todo_img;

    return await this.todoRepository.save(todo);
  }

  // UPDATE
  async update(todo_id: number, dto: UpdateTodoDto): Promise<Todo> {
    const todo = await this.todoRepository.findOneBy({ todo_id });

    Object.keys(dto).forEach((key) => {
      if (dto[key] !== null && dto[key] !== undefined) {
        todo[key] = dto[key];
      }
    });

    return await this.todoRepository.save(todo);
  }

  // DELETE
  async delete(todo_id: number): Promise<void> {
    const todo = await this.todoRepository.findOneBy({ todo_id });
    todo.todo_deleted = true;
    await this.todoRepository.save(todo);
  }

  // 투두 완료상태 변경
  async editDone(todo_id: number, todo_done: boolean, user: User) {
    const today: Date = new Date();
    const { user_id } = user;

    const { grp_id, todo_date } = await this.todoRepository
      .createQueryBuilder()
      .select(['grp_id', 'todo_date'])
      .where('todo_id = :todo_id', { todo_id: todo_id })
      .andWhere('user_id = :user_id', { user_id: user_id })
      .getRawOne();

    if (todo_date == null) {
      // 투두가 없음
      throw this.doWithExceptions.NoData;
    }

    const todo_group = grp_id != null;

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 기존 오늘 완료된 투두
      const todayDoneCnt = await this.todoRepository
        .createQueryBuilder('todo')
        .where('user_id = :user_id', { user_id })
        .andWhere('DATE(todo.todo_date) = DATE(:today)', { today })
        .andWhere('todo_done = true')
        .getCount();

      // 1. 투두 업데이트
      const updatedTodo = await queryRunner.manager
        .createQueryBuilder()
        .update(Todo)
        .set({
          todo_done: todo_done,
        })
        .where('todo_id = :id', { id: todo_id })
        .execute();

      if (updatedTodo.affected === 0) {
        // 투두가 없음
        Logger.log('Todo data does not exist');
        throw this.doWithExceptions.NoData;
      }

      // 2. 투두 관련 리워드 계산 & 유저 업데이트
      const cash = this.calculateCash(
        todo_done,
        todo_group,
        todo_date,
        todayDoneCnt,
      );
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
        throw this.doWithExceptions.NoData;
      }

      // TODO: 그룹으로 옮기기
      // 2. 그룹인 경우 메인으로 설정된 유저 펫 경험치 업데이트
      if (todo_group) {
        const main_pet = await this.getUserMainPet(user_id);
        // 펫이 존재하지 않음
        if (main_pet == null) {
          throw this.doWithExceptions.NoData;
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
        const petExp = this.calculatePetExp(todo_done, todo_date);

        const updateExp = await queryRunner.manager
          .createQueryBuilder()
          .update(ItemInventory)
          .set({
            pet_exp: () => 'pet_exp + :exp',
          })
          .where('user_id = :user_id', { user_id: user_id, exp: petExp })
          .andWhere('item_id = :item_id', { item_id: item_id })
          .execute();

        if (updateExp.affected === 0) {
          Logger.log('Pet data does not exist');
          throw this.doWithExceptions.NoData;
        }

        // 3. 펫 진화가 필요한 경우 진화
        // const [pet_type, pet_level] = item_name.split('_');

        // if (
        //   (pet_level === this.PET_LV1 && pet_exp >= this.PET_LV1_EXP) ||
        //   (pet_level === this.PET_LV2 && pet_exp >= this.PET_LV2_EXP)
        // ) {
        //   // 펫 진화 부분
        //   const next_pet_name = `${pet_type}_0${parseInt(pet_level) + 1}`;
        //   const next_pet: ItemInventory = await this.dataSource
        //     .createQueryBuilder(ItemInventory, 'iv')
        //     .select()
        //     .where('item_name = :item_name', { item_name: next_pet_name })
        //     .getOne();

        //   if (next_pet == null) {
        //     throw this.doWithExceptions.NoData;
        //   }

        //   // 인벤토리에 새 펫 배치
        //   await this.dataSource
        //     .createQueryBuilder()
        //     .insert()
        //     .into(ItemInventory)
        //     .values([
        //       {
        //         user_id: user_id,
        //         item_id: next_pet.item_id,
        //         pet_name: pet_name,
        //         pet_exp: 0, // 경험치는 다시 0으로
        //       },
        //     ])
        //     .execute();

        //   // 메인 룸에 배치 [삭제 후 삽입]
        //   await this.dataSource
        //     .createQueryBuilder(Room, 'r')
        //     .delete()
        //     .where('user_id = :user_id', { user_id })
        //     .andWhere('item_id = :item_id', { item_id })
        //     .execute();

        //   await this.dataSource
        //     .createQueryBuilder()
        //     .insert()
        //     .into(Room)
        //     .values([
        //       {
        //         user_id: user_id,
        //         item_id: next_pet.item_id,
        //       },
        //     ])
        //     .execute();
        // }
      }

      // 업데이트 결과 반환
      const result = await queryRunner.manager
        .createQueryBuilder(User, 'u')
        .leftJoin('todo', 't', 't.user_id = u.user_id')
        .leftJoin(
          'item_inventory',
          'iv',
          //   'iv.user_id = u.user_id AND iv.item_id = :item_id',
          'iv.user_id = u.user_id',
        )
        .select([
          'u.user_id as user_id',
          'u.user_cash as user_cash',
          't.todo_id as todo_id',
          't.todo_done as todo_done',
          'iv.item_id as item_id',
          'iv.pet_exp as pet_exp',
        ])
        .where('u.user_id = :user_id', { user_id: user_id })
        .andWhere('t.todo_id = :todo_id', { todo_id: todo_id })
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

  // === Helpers === //
  /**
   * 유저의 Room에 있는 펫을 가져옵니다.
   * @param user_id
   * @returns
   */
  private async getUserMainPet(user_id: number) {
    return await this.dataSource
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
   * 유저의 펫을 진화시킵니다.
   * @param user_id
   * @param pet_name 펫 이름 ex. 귀염둥이
   * @param pet_type 펫 아이템 이름 ex. 구미호
   * @param pet_level 펫 레벨 ex. '03'
   * @returns
   */
  private async evolveUserMainPet(
    user_id: number,
    pet_name: string,
    pet_type: string,
    pet_level: string,
  ) {}

  /**
   * 유저 캐시 보상 계산
   * @param todo_done
   * @param todo_group
   * @param todo_date
   * @param todayDoneCnt
   * @returns
   */
  private calculateCash(
    todo_done: boolean,
    todo_group: boolean,
    todo_date: Date,
    todayDoneCnt: number,
  ) {
    const today = new Date();
    todo_date.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    if (todo_date < today) {
      // 지난 날짜 투두는 제외
      return 0;
    }

    if (
      (todo_done && todayDoneCnt === 0) ||
      (!todo_done && todayDoneCnt === 1)
    ) {
      // 투두를 완료 체크한 경우 (첫 번째 투두 체크 또는 마지막 투두 체크해제)
      return todo_done ? 100 : -100;
    } else if (!todo_group && todayDoneCnt >= 10) {
      // 개인 투두는 10개까지 제한
      return 0;
    }
    // 기본 캐시 계산
    return todo_group ? (todo_done ? 25 : -25) : todo_done ? 10 : -10;
  }

  /**
   * 펫 경험치 계산
   * @param todo_done
   * @param todo_date
   * @returns
   */
  private calculatePetExp(todo_done: boolean, todo_date: Date) {
    const today = new Date();
    todo_date.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    if (todo_date < today) {
      // 지난 날짜 투두는 제외
      return 0;
    }

    return todo_done ? 10 : -10;
  }
}
