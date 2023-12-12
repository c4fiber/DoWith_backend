import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
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

  async editDone(todo_id: number, todo_done: boolean, user_id: number) {
    const today: Date = new Date();

    const qr = this.dataSource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();

    try {
      // 1. 투두 업데이트
      const updatedTodo = await qr.manager.createQueryBuilder()
                                          .update(Todo)
                                          .set({ todo_done })
                                          .where('todo_id = :todo_id', { todo_id })
                                          .execute();

      // 2. 투두 관련 리워드 계산 & 유저 업데이트
      const query = qr.manager.createQueryBuilder(User, 'u')
                              .leftJoin('todo', 't', 't.user_id = u.user_id')
                              .select([
                                'u.user_id   AS user_id'
                              , 'u.user_cash AS user_cash'
                              , 't.todo_id   AS todo_id'
                              , 't.todo_done AS todo_done'
                              ])
                              .where('u.user_id = :user_id', { user_id })
                              .andWhere('t.todo_id = :todo_id', { todo_id });

      // 체크한 To-Do가 오늘이 아닌 이미 지난 날짜인 경우 종료
      const isToday = await this.todoRepo.createQueryBuilder('t')
                                         .where(`to_char(now(), 'yyyyMMdd') = to_char(todo_date, 'yyyyMMdd')`)
                                         .andWhere({ todo_id })
                                         .getRawOne();
      if(!isToday){
        await qr.commitTransaction();
        return { result: await query.getRawOne() };
      }

      const sign = todo_done ? 1 : -1;
      // 2. 리워드 제공 - 추가되야할 캐시 계산(10개 초과시 0점)
      const reward = await this.todoRepo.createQueryBuilder()
                                        .select(`case when count(*) = 1
                                                      then ${sign} * ${Reward.FIRST_TODO_REWARD}
                                                      when count(*) > 10
                                                      then 0
                                                      else ${sign} * ${Reward.NORAML_TODO_REWARD}
                                                  end as reward`)
                                        .where({ user_id })
                                        .andWhere(`to_char(now(), 'yyyyMMdd') = to_char(todo_date, 'yyyyMMdd')`)
                                        .andWhere('todo_done = true')
                                        .getRawOne();

      Logger.debug("################");
      Logger.debug(reward);
      Logger.debug(sign);
      Logger.debug("################");
      // 2. 리워드 제공 - 캐시(오늘 처음: 100, 그 외: 10)
      await qr.manager.createQueryBuilder()
                      .update('user')
                      .set({
                        user_cash: () => `user_cash + ${reward.reward}`
                      })
                      .where('user_id = :user_id', { user_id })
                      .execute();

      await qr.commitTransaction();
      return { result: await query.getRawOne() };
    } catch (error) {
      await qr.rollbackTransaction();
      throw new Error(error);
    } finally {
      await qr.release();
    }
  }
}