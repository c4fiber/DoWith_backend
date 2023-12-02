import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DoWithExceptions } from 'src/do-with-exception/do-with-exception';
import { UserResponseDto } from 'src/user/dto/user-response.dto';
import { User } from 'src/user/user.entities';
import { Repository } from 'typeorm';
import { FreindRequestDto } from './dto/friend-request.dto';
import { UserFriend } from 'src/user_friend/entities/user_group.entity';

enum FriendStatus{
    FRIEND    = '00'
  , REQUESTED = '01'
  , REJECTED  = '10'
  , BLOCKED   = '11'
}
@Injectable()
export class FriendService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(UserFriend)
    private readonly userFriRepo: Repository<UserFriend>,
    private readonly doWithExceptions: DoWithExceptions,
  ) {}

  // TODO: 예외처리들..
  // 친구 조회
  async getFriends(id: number): Promise<UserResponseDto[]> {
    const user: User = await this.userRepository.findOne({
      where: { user_id: id },
      relations: ['friends'],
    });

    // 유저가 없는 경우
    if (user == null) {
      throw this.doWithExceptions.UserNotFound;
    }

    console.log(user.friends);

    // 친구가 없는 경우
    if (user.friends.length == 0) return [];

    // 결과 리턴
    return user.friends.map((friend) => new UserResponseDto(friend));
  }

  /**
   * 친구 추가
   * @param body  Response Body
   * @description 1. 상대방과 나의 관계
   *              2. 나와 상대방의 관계
   *              3.
   * @returns Promise<{result}>}
   */
  async createFriend(body: FreindRequestDto): Promise<{ result }> {
    const { user_id, friend_id } = body;

    if(user_id === friend_id){
      throw this.doWithExceptions.SelfFriendship;
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
        throw this.doWithExceptions.BlockedByFriend;
      }

      // 1. 이미 친구라면 요청 종료
      if(otherSide.status == FriendStatus.FRIEND){
        throw this.doWithExceptions.AlreadyInFriendship;
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
        throw this.doWithExceptions.BlockedByFriend;
      }

      // 2. 이미 친구라면 요청 종료
      if(mySide.status == FriendStatus.FRIEND){
        throw this.doWithExceptions.AlreadyInFriendship;
      }

      // 2. 이미 요청을 보낸 상태인 경우
      if(mySide.status == FriendStatus.REQUESTED){
        throw this.doWithExceptions.AlreadySendRequest;
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

  // 친구 삭제
  async deleteFriend(body: FreindRequestDto): Promise<boolean> {
    const { user_id, friend_id } = body;
    // 자기 자신과 친구 요청 예외처리
    if (user_id === friend_id) {
      throw this.doWithExceptions.SelfFriendship;
    }

    const user = await this.userRepository.findOne({
      where: { user_id: user_id },
      relations: ['friends'],
    });

    user.friends = user.friends.filter((friend) => friend.user_id != friend_id);
    return await this.userRepository
      .save(user)
      .then((_) => true)
      .catch((_) => false);
  }
}
