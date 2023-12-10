import { Injectable, Logger } from '@nestjs/common';
import { User } from '../../entities/user.entities';
import { UserRequestDto as UserRequestDto } from './dto/user-request.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, QueryRunner, Repository } from 'typeorm';
import { DoWithExceptions } from 'src/utils/do-with-exception';
import { UserResponseDto } from './dto/user-response.dto';
import { GetUsersByContactsDto } from './dto/get-users-by-contacts.dto';
import { Room } from 'src/entities/room.entity';
import { JwtService } from '@nestjs/jwt';
import { v4 as uuidV4 } from 'uuid';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly doWithException: DoWithExceptions,
    private readonly dataSource: DataSource,
    private readonly jwtService: JwtService,
  ) {}

  // 유저 정보를 반환합니다.
  async getUserInfo(user: User) {
    const {user_id} = user;
    const user_pet = await this.getUserMainPet(user_id);
  
    const result = { user, user_pet };
    return { result };
  }

  // 아이디로 조회 (see app_gateway)
  async getUser(id: number): Promise<UserResponseDto> {
    const user = await this.userRepository.findOneBy({ user_id: id });
    return new UserResponseDto(user);
  }

  // 유저 수정
  async updateUser(id: number, request: UserRequestDto): Promise<boolean> {
    // 만약 중복된 이름일 경우 예외 반환
    const { user_name, user_tel } = request;
    const user = await this.userRepository.findOneBy({ user_name: user_name });
    if (user !== null) {
      throw this.doWithException.UserNameNotUnique;
    }

    const updateResult = await this.userRepository
      .createQueryBuilder('user')
      .update(User)
      .set({
        user_name: user_name,
        user_tel: user_tel,
      })
      .where('user_id = :id', { id })
      .execute();

    if (updateResult.affected === 0) {
      throw this.doWithException.UserNotFound;
    }
    return true;
  }

  // 아이디를 기준으로 유저 삭제
  async deleteUser(user_id: number) {
    const user = await this.getUser(user_id);
    if (user == null) {
      throw this.doWithException.UserNotFound;
    }
    
    const qr = this.dataSource.createQueryRunner();
    const uuid = uuidV4();
    await qr.connect();
    await qr.startTransaction(); 

    try {
      const result = await this.userRepository.createQueryBuilder()
                                              .update()
                                              .set({
                                                user_name: uuid
                                              , user_kakao_id: uuid
                                              , del_at: () => 'CURRENT_TIMESTAMP'
                                              })
                                              .where('user_id = :user_id', { user_id })
                                              .execute();

      await qr.manager.createQueryBuilder()
                      .delete()
                      .from('user_group')
                      .where('user_id = :user_id', { user_id })
                      .execute();
      
      await qr.manager.createQueryBuilder()
                      .delete()
                      .from('user_friend')
                      .where('user_id = :user_id', { user_id })
                      .orWhere('friend_id = :user_id', { user_id })
                      .execute();

      await qr.commitTransaction();
      return { result };
    } catch(err) {
      await qr.rollbackTransaction();
      throw new Error(err);
    } finally {
      qr.release();
    }
  }

  // 유저 HP 업데이트
  async updateHp(id: number, hp: number): Promise<boolean> {
    const updateResult = await this.userRepository
      .createQueryBuilder('user')
      .update(User)
      .set({ user_hp: hp })
      .where('user_id = :id', { id })
      .execute();

    if (updateResult.affected === 0) {
      throw this.doWithException.UserNotFound;
    }
    return true;
  }

  // 연락처 리스트로 조회
  async getUsersByContacts(
    body: GetUsersByContactsDto,
  ): Promise<UserResponseDto[]> {
    const { contacts } = body;

    if (contacts.length == 0) {
      return [];
    }

    const users = await this.userRepository
      .createQueryBuilder('user')
      .where('user_tel IN (:...tels)', { tels: contacts })
      .getMany();

    return users.map((user) => new UserResponseDto(user));
  }

  async updateSocketId(user_id: number, socket_id: string): Promise<boolean> {
    const user = await this.userRepository.findOne({ where: { user_id }});
    if (!user) {
      return false;
    }

    user.socket_id = socket_id;
    await this.userRepository.save(user);
    return true;
  }


  // 유저의 Room에 있는 펫을 가져옵니다.
  private async getUserMainPet(user_id: number) {
    return await this.dataSource
      .getRepository(Room)
      .createQueryBuilder('r')
      .innerJoin('item_inventory', 'iv', 'r.item_id = iv.item_id AND iv.user_id = :user_id')
      .leftJoin('item_shop', 'ish', 'r.item_id = ish.item_id')
      .where('r.user_id = :user_id AND ish.type_id = :PET_TYPE', { user_id: user_id, PET_TYPE: 1 })
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

  // hp및 상태 조회 (다른 사람이 봐도 문제없는 내용만 포함하도록)
  async getUserStatus(user_id: number) {
    const result = await this.userRepository.createQueryBuilder()
    .select(['user_hp', 'user_name']).where('user_id = :user_id', { user_id }).getRawOne();

  if (!result) {
    throw this.doWithException.UserNotFound;
  }

    return { result }
  }

  async getUserstatistics(user_id: number){
    const qr = this.dataSource.createQueryRunner();
    const pet_exps = await qr.manager.createQueryBuilder()
                                     .select(['sum(iv.pet_exp)'])
                                     .from('item_inventory', 'iv')
                                     .where({ user_id })
                                     .andWhere('iv.pet_exp IS NOT NULL')
                                     .getRawOne();
    const todo_score = await qr.manager.createQueryBuilder()
                                       .select([
                                         'COUNT(*) FILTER(where t.grp_id IS NULL) as todo_score'
                                       , 'COUNT(*) FILTER(where t.grp_id IS NOT NULL) as rout_score'
                                       ])
                                       .from('todo', 't')
                                       .where({ user_id })
                                       .andWhere('t.todo_done = true')
                                       .getRawOne();
    const login_score = await this.userRepository.createQueryBuilder('u')
                                                 .select(['(login_cnt * 10) + (user_hp * 10) as login_score'])
                                                 .where({ user_id })
                                                 .getRawOne();
    const achi_score = await qr.manager.createQueryBuilder()
                                       .select(['SUM(a.achi_score) AS achi_score'])
                                       .from('user_achi', 'ua')
                                       .innerJoin('achievements', 'a', 'ua.achi_id = a.achi_id')
                                       .where({ user_id })
                                       .getRawOne();
    Logger.debug(JSON.stringify(pet_exps));
    Logger.debug(JSON.stringify(todo_score));
    Logger.debug(JSON.stringify(login_score));
    Logger.debug(JSON.stringify(achi_score));
    const sum = +pet_exps.pet_exp + +todo_score.todo_score + +todo_score.rout_score + +login_score.login_score + +achi_score.achi_score;
    Logger.debug(sum);
    return ;
  }
}
