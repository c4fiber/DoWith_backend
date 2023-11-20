import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DoWithExceptions } from 'src/do-with-exception/do-with-exception';
import { UserResponseDto } from 'src/user/dto/user-response.dto';
import { User } from 'src/user/user.entities';
import { Repository } from 'typeorm';
import { FreindRequestDto } from './dto/friend-request.dto';

@Injectable()
export class FriendService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly doWithException: DoWithExceptions,
  ) {}

  // TODO: 예외처리들..
  // 친구 조회
  async getFriends(id: number): Promise<UserResponseDto[]> {
    const user = await this.userRepository.findOne({
      where: { user_id: id },
    });
    return user.friends.map((friend) => new UserResponseDto(friend));
  }

  // 친구 추가
  async createFriend(body: FreindRequestDto): Promise<UserResponseDto> {
    const { user_id, friend_id } = body;

    const user = await this.userRepository.findOne({
      where: { user_id: user_id },
      relations: ['friends'],
    });

    const friend = await this.userRepository.findOne({
      where: { user_id: friend_id },
    });

    // 자기 자신과 친구 맺기 요청 예외처리
    if (user.user_id === friend.user_id) {
      throw this.doWithException.SelfFriendship;
    }

    user.friends.push(friend);
    return this.userRepository
      .save(user)
      .then((user) => new UserResponseDto(user));
  }

  // 친구 삭제
  async deleteFriend(body: FreindRequestDto): Promise<void> {
    const { user_id, friend_id } = body;
    const user = await this.userRepository.findOne({
      where: { user_id: user_id },
      relations: ['friends'],
    });
    user.friends = user.friends.filter((friend) => friend.user_id != friend_id);
    await this.userRepository.save(user);
  }
}
