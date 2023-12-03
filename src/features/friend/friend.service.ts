import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DoWithExceptions } from 'src/utils/do-with-exception/do-with-exception';
import { User } from 'src/entities/user.entities';
import { Repository } from 'typeorm';
import { FreindRequestDto } from './dto/friend-request.dto';
import { UserFriend } from 'src/entities/user_friend.entity';
import { getIdsFromItems } from 'src/utils/paging/PagingOptions';
import { FriendStatus } from 'src/enums/FriendStatus.enum';

@Injectable()
export class FriendService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(UserFriend)
    private readonly userFriRepo: Repository<UserFriend>,
    private readonly dwExcept: DoWithExceptions,
  ) {}

  /**
   * 친구 목록 조회
   * @param user_id 친구 목록 가지고 있는 user_id
   * @returns 
   */
  async getFriends(user_id: number): Promise<{ result, total }>{
    const firends = await this.userFriRepo.createQueryBuilder('uf')
                                          .select([
                                            `CASE WHEN user_id = :user_id
                                                  THEN friend_id
                                                  ELSE user_id
                                              END AS user_id`
                                          ])
                                          .setParameter('user_id', user_id)
                                          .where('(friend_id = :user_id OR user_id = :user_id)', { user_id })
                                          .andWhere('status = :status', { status: FriendStatus.FRIEND })
                                          .getRawMany();
    const frinedIds = getIdsFromItems(firends, 'user_id');
    const result = await this.userRepo.createQueryBuilder('u')
                                      .select([
                                        'u.user_id   AS user_id'
                                      , 'u.user_name AS user_name'
                                      , 'u.total_exp AS total_exp'
                                      , 'iv.pet_name AS pet_name'
                                      ])
                                      .innerJoin('room'         , 'r'  , 'u.user_id = r.user_id')
                                      .leftJoin('item_inventory', 'iv' , 'u.user_id = iv.user_id AND r.item_id = iv.item_id')
                                      .leftJoin('item_shop'     , 'ish', 'iv.item_id = ish.item_id')
                                      .where('u.user_id IN (:...frinedIds)', { frinedIds })
                                      .andWhere('ish.type_id = 1')
                                      .orderBy('u.total_exp', 'DESC')
                                      .getRawMany();

    return { result, total: result.length };
  }

  /**
   * 친구 추가
   * @param body  Response Body
   * @description 1. 상대방과 나의 관계 확인
   *              2. 나와 상대방의 관계 확인
   * @returns Promise<{result}>}
   */
  async createFriend(body: FreindRequestDto): Promise<{ result }> {
    const { user_id, friend_id } = body;

    if(user_id === friend_id){
      throw this.dwExcept.SelfFriendship;
    }

    const otherSide = await this.userFriRepo.findOne({
      select: ['status'],
      where: [
          {user_id: friend_id, friend_id: user_id}
      ]
    });

    if(otherSide){
      // 1. 상대가 나를 차단한 경우
      if(otherSide.status == FriendStatus.BLOCKED){
        throw this.dwExcept.BlockedByFriend;
      }

      // 1. 이미 친구라면 요청 종료
      if(otherSide.status == FriendStatus.FRIEND){
        throw this.dwExcept.AlreadyInFriendship;
      }

      // 1. 상대방이 요청을 보냈다면 친구 관계로 변경 후 종료
      if(otherSide.status == FriendStatus.REQUESTED){
        const result = await this.userFriRepo.createQueryBuilder()
                                             .update()
                                             .set({
                                               status: FriendStatus.FRIEND
                                             })
                                             .where({user_id: friend_id, friend_id: user_id})
                                             .execute()
        return { result };
      }
    }

    const mySide = await this.userFriRepo.findOne({
      select: ['status'],
      where: [
          {user_id, friend_id}
      ]
    });

    if(mySide){
      // 2. 내가 상대방을 차단한 경우
      if(mySide.status == FriendStatus.BLOCKED){
        throw this.dwExcept.BlockedByMe;
      }

      // 2. 이미 친구라면 요청 종료
      if(mySide.status == FriendStatus.FRIEND){
        throw this.dwExcept.AlreadyInFriendship;
      }

      // 2. 이미 요청을 보낸 상태인 경우
      if(mySide.status == FriendStatus.REQUESTED){
        throw this.dwExcept.AlreadySendRequest;
      }

      // 2. 요청은 보냈으나 거절 당한 경우
      const result = await this.userFriRepo.createQueryBuilder()
                                           .update()
                                           .set({
                                             user_id  : user_id
                                           , friend_id: friend_id
                                           , status:  FriendStatus.REQUESTED
                                           })
                                           .where({ user_id, friend_id })
                                           .orWhere({ user_id: friend_id, friend_id: user_id })
                                           .execute();
      return { result };
    }
    
    const result = await this.userFriRepo.createQueryBuilder()
                                         .insert()
                                         .values({
                                           user_id  :user_id
                                         , friend_id: friend_id
                                         })
                                         .execute();

    return { result };
  }

  /**
   * 친구 삭제 함수
   * @discription 양방향으로 삭제
   * @param body 
   * @returns 
   */
  async deleteFriend(body: FreindRequestDto): Promise<{ result }> {
    const { user_id, friend_id } = body;
    // 자기 자신과 친구 요청 예외처리
    if (user_id === friend_id) {
      throw this.dwExcept.SelfFriendship;
    }

    const res1 = await this.userFriRepo.createQueryBuilder()
                                       .delete()
                                       .where('user_id = :user_id', { user_id })
                                       .execute();
    const res2 = await this.userFriRepo.createQueryBuilder()
                                       .delete()
                                       .where('user_id = :friend_id', { friend_id })
                                       .execute();

    if(res1.affected === 0 && res2.affected === 0){
      throw this.dwExcept.NotInFriendship;
    }

    return { result: res1.affected === 1 ? res1 : res2 };
  }
}
