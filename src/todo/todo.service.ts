import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { Todo } from './todo.entity';
import { CreateTodoDto } from './dto/create-todo.dto';
import { UpdateTodoDto } from './dto/update-todo.dto';
import { DoWithExceptions } from 'src/do-with-exception/do-with-exception';
import { User } from 'src/user/user.entities';

@Injectable()
export class TodoService {
  constructor(
    @InjectRepository(Todo)
    private readonly todoRepository: Repository<Todo>,
    private readonly doWithExceptions: DoWithExceptions,
    private readonly dataSource: DataSource,
  ) {}

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

  async createTodayTodo(user_id: number) {
    /**
     * 1. 마지막 로그인 일자 갱신
     * 2. 연속 로그인 갱신
     * 3. 누적 로그인 갱신
     * 4. Routine에서 만들어지는 To-Do 생성
     */
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

      // 3. 연속 로그인 증가
      const result = await queryRunner.manager
        .createQueryBuilder()
        .update('user')
        .set({ login_cnt: () => '"login_cnt" + 1' })
        .where({ user_id })
        .execute();
      if (result.affected === 0) {
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
  async editDone(
    todo_id: number,
    dto: UpdateTodoDto,
    user: User,
  ): Promise<{ updated_todo: Todo; updated_user: User }> {
    const todo = await this.todoRepository.findOneBy({ todo_id });

    const today: Date = new Date();
    const { user_id } = user;

    const isGroup = todo.grp_id != null;
    const isDone = dto.todo_done == true;

    const query = this.todoRepository
      .createQueryBuilder('todo')
      .where('user_id = :user_id', { user_id })
      .andWhere('DATE(todo.todo_date) = DATE(:today)', { today });

    // 기존 오늘자 투두, 오늘 완료된 투두
    const [todayCnt, todayDoneCnt] = await Promise.all([
      query.getCount(),
      query.clone().andWhere('todo_done = true').getCount(),
    ]);

    // TODO: fix
    const newDoneCnt = todayDoneCnt + (isDone ? 1 : -1);
    const achieveRate = (newDoneCnt / todayCnt) * 100;

    const addHp = achieveRate >= 90 ? 10 : -10; // 유저 HP
    let addCash = this.getCashAmount(isDone, isGroup, todayDoneCnt);
    // let addPetExp = this.getPetExp(isGroup, todayDoneCnt);

    const manager: EntityManager = this.dataSource.manager;
    const queryRunner = this.dataSource.createQueryRunner();

    return await manager.transaction(async (manager) => {
      // update todo
      await manager.update(
        Todo,
        { todo_id: todo.todo_id },
        { todo_done: isDone },
      );

      // update user
      const user = await manager.findOneBy(User, {
        user_id: todo.user_id,
      });

      // 유저가 없는 경우
      if (user == null) {
        throw this.doWithExceptions.UserNotFound;
      }

      const { user_cash, user_hp } = user;
      const result = await manager.update(
        User,
        { user_id: todo.user_id },
        {
          // 1. 그룹&개인: 캐시 업데이트
          user_cash: user_cash + addCash,
          // 2. 그룹&개인: HP 업데이트
          user_hp: user_hp + addHp,
          // 3. 그룹만: 펫 경험치 업데이트
        },
      );

      // 유저 테이블에 업데이트가 되지 않은 경우
      if (result.affected == 0) {
        throw this.doWithExceptions.UserNotFound;
      } else {
        // 업데이트된 데이터 반환
        const updatedTodo = await manager.findOneBy(Todo, { todo_id: todo_id });
        const updatedUser = await manager.findOneBy(User, { user_id: user_id });
        return {
          updated_todo: updatedTodo,
          updated_user: updatedUser,
        };
      }
    });
  }

  // === Helpers === //
  private getCashAmount(
    isDone: boolean,
    isGroup: boolean,
    todayDoneCnt: number,
  ) {
    if ((isDone && todayDoneCnt === 0) || (!isDone && todayDoneCnt === 1)) {
      // 투두를 완료 체크한 경우 (첫 번째 투두 체크 또는 마지막 투두 체크해제)
      return isDone ? 100 : -100;
    } else if (!isGroup && todayDoneCnt >= 10) {
      // 개인 투두는 10개까지 제한
      return 0;
    }
    // 기본 캐시 계산
    return isGroup ? (isDone ? 25 : -25) : isDone ? 10 : -10;
  }

  private getPetExp(isGroup: boolean, todayDoneCnt: number) {
    if (isGroup && todayDoneCnt >= 50) {
      // 개인은 하루 최대 50개까지 제한
      return 0;
    }
    // 개인이면 5, 그룹이면 10
    return isGroup ? 5 : 10;
  }
}
