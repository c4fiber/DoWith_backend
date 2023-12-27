import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, QueryRunner, Repository } from 'typeorm';
import { Todo } from 'src/entities/todo.entity';
import { CreateTodoDto } from './dto/create-todo.dto';
import { UpdateTodoDto } from './dto/update-todo.dto';
import { DoWithExceptions } from 'src/utils/do-with-exception';
import { User } from 'src/entities/user.entities';
import { Reward } from 'src/enums/Reward.enum';
import { Days } from 'src/enums/Days.enum';
import { AchiLogin } from 'src/enums/AchiLogin.enum';



@Injectable()
export class TodoService {
  constructor(
    @InjectRepository(Todo)
    private readonly todoRepo: Repository<Todo>,
    private readonly dwExcept: DoWithExceptions,
    private readonly dataSource: DataSource,
  ) {}

  // READ
  async findAllByUser(user_id: number){
    const todos = await this.todoRepo.createQueryBuilder('t')
                                     .select([
                                       't.todo_id      AS todo_id'
                                     , 't.user_id      AS user_id'
                                     , 't.todo_name    AS todo_name'
                                     , 't.todo_desc    AS todo_desc'
                                     , 't.todo_label   AS todo_label'
                                     , `to_char(t.todo_date, 'yyyyMMdd') AS todo_date`
                                     , 't.todo_done    AS todo_done'
                                     , 't.todo_start   AS todo_start'
                                     , 't.todo_end     AS todo_end'
                                     , 't.grp_id       AS grp_id'
                                     , 't.todo_img     AS todo_img'
                                     ]) 
                                     .where({ user_id })
                                     .andWhere('t.todo_deleted = false')
                                     .andWhere('t.grp_id IS NULL')
                                     .andWhere(`(to_char(t.todo_date, 'yyyyMMdd') = to_char(now(), 'yyyyMMdd') OR t.todo_done = false)`)
                                     .getRawMany();

    const routs = await this.todoRepo.createQueryBuilder('t')
                                     .select([
                                       't.todo_id      AS todo_id'
                                     , 't.user_id      AS user_id'
                                     , 't.todo_name    AS todo_name'
                                     , 't.todo_desc    AS todo_desc'
                                     , 't.todo_label   AS todo_label'
                                     , `to_char(t.todo_date, 'yyyyMMdd') AS todo_date`
                                     , 't.todo_done    AS todo_done'
                                     , 't.todo_start   AS todo_start'
                                     , 't.todo_end     AS todo_end'
                                     , 't.grp_id       AS grp_id'
                                     , 't.todo_img     AS todo_img'
                                     ]) 
                                     .where({ user_id })
                                     .andWhere('t.todo_deleted = false')
                                     .andWhere('t.grp_id IS NOT NULL')
                                     .andWhere(`to_char(t.todo_date, 'yyyyMMdd') = to_char(now(), 'yyyyMMdd')`)
                                     .getRawMany();

    return { result: { todos, routs } };
  }

  /**
   * 오늘의 To-Do 생성기 
   * @param user_id
   * @description 유저가 가입한 그룹의 루틴이 개인의 To-Do에 반영됩니다.
   *              1. 마지막 로그인 일자 갱신
   *              2. 연속 로그인 갱신
   *              3. 누적 로그인 갱신
   *              4. Routine에서 만들어지는 To-Do 생성
   *              5. login_cnt에 따른 업적 달성
   *              6. login 안한 일 수 만큼 hp 마이너스
   *              7. 사용자 오늘자 출석
   * @returns 
   */
  async createTodayTodo(user_id: number){
    const qr = this.dataSource.createQueryRunner();
    // 마지막 로그인 유저 정보
    const user = await qr.manager.createQueryBuilder()
                                 .from('user', 'u')
                                 .where('u.user_id = :user_id', { user_id })
                                 .andWhere(
                                   `to_char(u.last_login, 'yyyyMMdd') = to_char(now(), 'yyyyMMdd')`,
                                 )
                                 .getRawOne();

    // 오늘 첫 로그인인 경우 동작하는 로직
    try {
      await qr.connect();
      await qr.startTransaction();

      // 1. 마지막 로그인 일자 갱신 쿼리 (실행 x)
      const newLastLogin = qr.manager.createQueryBuilder()
                                     .update('user')
                                     .set({ last_login: () => 'now()' })
                                     .where('user_id = :user_id', { user_id });

      // 이미 todo 생성했을 경우
      if (user) {
        // 1. 마지막 로그인 날짜로 최신화
        await newLastLogin.execute();
        throw this.dwExcept.AlreadyMadeTodos;
      }

      // 3. 누적 로그인 증가
      const result = await qr.manager.createQueryBuilder()
                                     .update('user')
                                     .set({ login_cnt: () => '"login_cnt" + 1' })
                                     .where({ user_id })
                                     .execute();

      if(result.affected === 0){
        throw this.dwExcept.UserNotFound;  
      }
      // 2. 연속 로그인 증가
      await qr.manager.createQueryBuilder()
                      .update('user')
                      .set({
                        user_hp:    // 3일전에 로그인 했었다면 hp는 -2
                        () => `CASE WHEN EXTRACT(DAY FROM AGE(now(), "last_login")) > 1
                                    THEN "user_hp" + 1 - EXTRACT(DAY FROM AGE(now(), "last_login"))
                                    WHEN "user_hp" = 10
                                    THEN "user_hp"
                                    ELSE "user_hp" + 1
                                END`,
                        login_seq:
                          () => `CASE WHEN EXTRACT(DAY FROM AGE(now(), "last_login")) = 1
                                      THEN "login_seq" + 1 
                                      ELSE 1
                                  END`,
                      })
                      .where({ user_id })
                      .execute();

      // 7. 사용자 오늘자 출석
      await qr.manager.createQueryBuilder()
                      .insert()
                      .into('attendance')
                      .values({ user_id })
                      .execute();
                      
      // 5. 로그인 관련 업적 확인을 위해 로그인 일 수 조회
      const login_cnt = await qr.manager.createQueryBuilder()
                                        .from('user', 'u')
                                        .select(['login_cnt'])
                                        .where({ user_id })
                                        .getRawOne();

      let achi_id = 0;
      // 5. 로그인 일 수가 업적 달성 조건에 일치한지 확인
      switch(login_cnt.login_cnt){
        case Days.A_DAY:
          achi_id = AchiLogin.FOR_A_DAY
          break;
        case Days.A_WEEK:
          achi_id = AchiLogin.FOR_A_WEEK
          break;
        case Days.A_MONTH:
          achi_id = AchiLogin.FOR_A_MONTH
          break;
        case Days.A_YEAR:
          achi_id = AchiLogin.FOR_A_YEAR
          break;
      }

      // 5. 업적 달성시 insert (ID: 0은 존재하지 않는 업적 ID)
      if(achi_id != 0){
        await qr.manager.createQueryBuilder()
                        .insert()
                        .into('user_achi')
                        .values({ 
                          user_id
                        , achi_id
                        })
                        .execute();
      }

      // 1. 오늘 로그인 날짜로 최신화
      await newLastLogin.execute();
      // 4. todo 생성기 - 유저가 가입한 그룹 리스트
      const subQuery = await qr.manager.createQueryBuilder()
                                       .select(['g.grp_id AS grp_id'])
                                       .from('group', 'g')
                                       .leftJoin('user_group', 'ug', 'g.grp_id = ug.grp_id')
                                       .where('ug.user_id = :user_id', { user_id })
                                       .getQuery();
      // 4. todo 생성기 - 가입한 그룹에서 오늘 요일에 해당하는 루틴 리스트
      const todos = await qr.manager.createQueryBuilder()
                                    .select([
                                      `${user_id}  AS user_id`
                                    , 'r.rout_name AS todo_name'
                                    , 'r.rout_desc AS todo_desc'
                                    , 'g.cat_id    AS todo_label'
                                    , 'r.rout_srt  AS todo_start'
                                    , 'r.rout_end  AS todo_end'
                                    , 'r.grp_id    AS grp_id'
                                    , 'r.rout_id   AS rout_id'
                                    ])
                                    .from('routine', 'r')
                                    .leftJoin('days', 'd', 'r.rout_repeat = d.rout_repeat')
                                    .leftJoin('group', 'g', 'g.grp_id = r.grp_id')
                                    .where(`r.grp_id IN (${subQuery})`, { user_id })
                                    .andWhere(`to_char(now(), 'dy') = ANY(d.days)`)
                                    .getRawMany();

      for (const todo of todos) {
        // 4. todo 생성기 - 루틴 리스트를 To-Do로 삽입
        const res = await qr.manager.createQueryBuilder()
                                    .insert()
                                    .into('todo')
                                    .values({
                                      user_id   : user_id
                                    , todo_name : todo.todo_name
                                    , todo_desc : todo.todo_desc
                                    , todo_label: todo.todo_label
                                    , todo_start: todo.todo_start
                                    , todo_end  : todo.todo_end
                                    , grp_id    : todo.grp_id
                                    , rout_id   : todo.rout_id
                                    })
                                    .execute();
      }

      await qr.commitTransaction();
      return { 
        result, 
        user_achi: await qr.manager.createQueryBuilder()
                                   .from('achievements', 'ac')
                                   .where('achi_id = :achi_id', { achi_id })
                                   .getRawOne()
      };
    } catch (err) {
      await qr.rollbackTransaction();
      throw new Error(err);
    } finally {
      await qr.release();
    }
  }

  async findOne(todo_id: number): Promise<Todo> {
    return await this.todoRepo.findOneBy({
      todo_id,
      todo_deleted: false,
    });
  }

  async getTodayCount(user_id: number) {
    const now = new Date();
    const query = this.todoRepo
      .createQueryBuilder('todo')
      .where('user_id = :user_id', { user_id })
      .andWhere('DATE(todo.todo_date) = DATE(:today)', { today: now });

    // 기존 오늘자 투두, 오늘 완료된 투두
    const [todo_today, todo_today_done] = await Promise.all([
      query.getCount(),
      query.clone().andWhere('todo_done = true').getCount(),
    ]);

    const result = { todo_today, todo_today_done };
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

    return await this.todoRepo.save(todo);
  }

  // UPDATE
  async update(todo_id: number, dto: UpdateTodoDto): Promise<Todo> {
    const todo = await this.todoRepo.findOneBy({ todo_id });

    Object.keys(dto).forEach((key) => {
      if (dto[key] !== null && dto[key] !== undefined) {
        todo[key] = dto[key];
      }
    });

    return await this.todoRepo.save(todo);
  }

  // DELETE
  async delete(todo_id: number): Promise<void> {
    const todo = await this.todoRepo.findOneBy({ todo_id });
    todo.todo_deleted = true;
    await this.todoRepo.save(todo);
  }

  // CHECK TODO
  async check(todo_id: number, todo_done: boolean, user: User) {
    return this.dataSource.transaction(async (manager: EntityManager) => {
        // 1. 투두 업데이트
        const todo = await manager.findOneBy(Todo, {todo_id: todo_id});
        Logger.debug(todo);
        Logger.debug(todo_done);
        if(todo_done === undefined || todo === null) {
            // 1-1. 투두가 없음
            throw this.dwExcept.NoData;
        }

        if(todo.user_id !== user.user_id) {
            // 1-2. 사용자의 투두가 아님
            throw this.dwExcept.Authorization;
        }

        if(todo.todo_done === todo_done) {
            // 1-3. 이미 체크된 경우, 응답 구성 및 반환
            const result = {
                user_id: user.user_id,
                user_cash: user.user_cash,
                todo_id: todo.todo_id,
                todo_done: todo.todo_done,
            }
            return { result };
        }

        todo.todo_done = todo_done;
        const savedTodo = await manager.save(todo);

        // 2. 투두 리워드 계산
        // 2-1. 지난 날짜 투두는 제외
        const now: Date = new Date();
        const year  = now.getFullYear();
        const month = (now.getMonth() + 1).toString().padStart(2, '0');
        const date  = now.getDate().toString().padStart(2, '0');

        const today = `${year}-${month}-${date}`;
        const todoDate = savedTodo.todo_date.toString();
        Logger.debug(`today: ${today}, tododate: ${todoDate}`)

        if(todoDate < today) {
            // 응답 구성, 반환
            const result = {
                user_id: user.user_id,
                user_cash: user.user_cash,
                todo_id: savedTodo.todo_id,
                todo_done: savedTodo.todo_done,
            }
            return { result };
        }

        // 2-2. 오늘 완료된 투두 개수 계산
        const user_id = user.user_id;
        const todayDone = await manager
            .createQueryBuilder()
            .from(Todo, 'todo')
            .where('todo.user_id = :user_id', {user_id})
            .andWhere('todo.todo_date = :today', {today})
            .andWhere('todo.todo_done = true')
            .getCount();


        // 2-3. 유저 캐시 업데이트
        if(todo_done) {
            if(todayDone === 1) {
                user.user_cash += Reward.FIRST_TODO_REWARD;
            } else {
                user.user_cash += Reward.NORAML_TODO_REWARD;
            }
        } else {
            if(todayDone === 0) {
                user.user_cash -= Reward.FIRST_TODO_REWARD;
            } else {
                user.user_cash -= Reward.NORAML_TODO_REWARD;
            }
        }

        const savedUser = await manager.save(user);

        // 3. 응답 구성, 반환
        const result = {
            user_id: savedUser.user_id,
            user_cash: savedUser.user_cash,
            todo_id: savedTodo.todo_id,
            todo_done: savedTodo.todo_done,
        };

        return { result }; 
    });
  }

  // 투두 완료상태 변경
  // [위 함수 테스트 완료되는대로 삭제 예정]
  async editDone(todo_id: number, todo_done: boolean, user_id: number) {
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
          todo_done: todo_done,
        })
        .where('todo_id = :id', { id: todo_id })
        .execute();

      if (updatedTodo.affected === 0) {
        // 투두가 없음
        throw this.dwExcept.NoData;
      }

      // 2. 투두 관련 리워드 계산 & 유저 업데이트
      // 투두 시간 가져오기
      const todo_date = await this.getTodoDate(queryRunner, todo_id);
      if (todo_date == null) {
        // 투두가 없음
        throw this.dwExcept.NoData;
      }

      // 지난 날짜 투두는 제외
      if (this.isPastTodo(todo_date)) {
        const result = await this.getUserTodoResult(
          queryRunner,
          user_id,
          todo_id,
        );

        await queryRunner.commitTransaction();
        return { result };
      }

      // 기존 오늘 완료된 투두 개수
      const todayDoneCnt = await this.todoRepo
        .createQueryBuilder('todo')
        .where('user_id = :user_id', { user_id })
        .andWhere('DATE(todo.todo_date) = DATE(:today)', { today })
        .andWhere('todo_done = true')
        .getCount();

      const cash = this.calculateCash(todo_done, todayDoneCnt);
      const userUpdated = await queryRunner.manager
        .createQueryBuilder()
        .update(User)
        .set({
          user_cash: () => 'user_cash + :cash',
        })
        .where('user_id = :id', { id: user_id, cash: cash })
        .execute();

      if (userUpdated.affected === 0) {
        throw this.dwExcept.NoData;
      }

      // 업데이트 결과 반환
      const result = await this.getUserTodoResult(
        queryRunner,
        user_id,
        todo_id,
      );

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
  private async getTodoDate(queryRunner: QueryRunner, todo_id: number) {
    const todo = await queryRunner.manager
      .createQueryBuilder(Todo, 't')
      .select(['todo_date'])
      .where('t.todo_id = :todo_id', { todo_id })
      .getRawOne();

    return todo ? todo.todo_date : null;
  }

  /**
   * 사용자 투두 완료체크 결과 반환
   * @param queryRunner
   * @param user_id
   * @param todo_id
   * @returns
   */
  private async getUserTodoResult(
    queryRunner: QueryRunner,
    user_id: number,
    todo_id: number,
  ) {
    return await queryRunner.manager
      .createQueryBuilder(User, 'u')
      .leftJoin('todo', 't', 't.user_id = u.user_id')
      .select([
        'u.user_id as user_id',
        'u.user_cash as user_cash',
        't.todo_id as todo_id',
        't.todo_done as todo_done',
      ])
      .where('u.user_id = :user_id', { user_id })
      .andWhere('t.todo_id = :todo_id', { todo_id })
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
      return todo_done ? 100 : -100;
    } else if (todo_done && todayDoneCnt >= 10) {
      // 개인 투두 달성 보상은 10개까지 제한
      return 0;
    }
    // 기본 캐시 계산
    return Reward.NORAML_TODO_REWARD * (todo_done ? 1 : -1);
  }
}
