import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DoWithExceptions } from 'src/do-with-exception/do-with-exception';
import { UserResponseDto } from 'src/user/dto/user-response.dto';
import { User } from 'src/user/user.entities';
import { Repository } from 'typeorm';
import { FreindRequestDto } from './dto/friend-request.dto';
import { UserFriend } from 'src/user_friend/entities/user_group.entity';

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

  // 친구 추가
  async createFriend(body: FreindRequestDto): Promise<{ result }> {
    const {user_id,friend_id} = body;
    const friendship = await this.userFriRepo.findOne({
      select: ['status'],
      where: [
          {user_id, friend_id}
        , {user_id: friend_id, friend_id: user_id}
      ]
    });

    if(friendship){
      Logger.debug(friendship.status);
    }

    // 자기 자신과 친구 요청 예외처리
    if (user_id === friend_id) {
      throw this.doWithExceptions.SelfFriendship;
    }

    const result = await this.userFriRepo.save(body);
    Logger.debug(result);
    
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
