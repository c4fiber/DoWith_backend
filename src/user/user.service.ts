import { Injectable } from '@nestjs/common';
import { User } from './user.entities';
import { UserRequestDto as UserRequestDto } from './dto/user-request.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DoWithExceptions } from 'src/do-with-exception/do-with-exception';
import { UserResponseDto } from './dto/user-response.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly doWithException: DoWithExceptions,
  ) {}

  // 아이디로 조회
  async getUser(id: number): Promise<UserResponseDto> {
    const user = await this.userRepository.findOneBy({ user_id: id });
    return new UserResponseDto(user);
  }

  // 새로운 유저 생성
  async createUser(request: UserRequestDto): Promise<UserResponseDto> {
    const { name, tel, kakao_id } = request;

    // 만약 이미 가입된 유저인 경우 예외처리
    if ((await this.getUserByKakaoId(kakao_id)) != null) {
      throw this.doWithException.UserAlreadyExists;
    }

    // 유저 엔티티 생성
    const now = new Date();
    const user = new User();

    user.user_name = name;
    user.user_tel = tel;
    user.user_kakao_id = kakao_id;
    user.reg_at = now;
    user.last_login = now;
    user.user_hp = 0;
    user.upt_at = now;

    await this.userRepository.save(user);
    return new UserResponseDto(user);
  }

  // 유저 수정
  async updateUser(id: number, request: UserRequestDto): Promise<boolean> {
    // 만약 중복된 이름일 경우 예외 반환
    const { name, tel } = request;
    const user = await this.userRepository.findOneBy({ user_name: name });
    if (user !== null) {
      throw this.doWithException.UserNameNotUnique;
    }

    const updateResult = await this.userRepository
      .createQueryBuilder()
      .update(User)
      .set({
        user_name: name,
        user_tel: tel,
        upt_at: new Date(),
      })
      .where('user_id = :id', { id })
      .execute();

    if (updateResult.affected === 0) {
      throw this.doWithException.UserNotFound;
    }
    return true;
  }

  // 유저 삭제
  async deleteUser(id: number): Promise<void> {
    const user = await this.getUser(id);
    if (user == null) {
      throw this.doWithException.UserNotFound;
    }

    this.userRepository.delete(id);
  }

  // 유저 HP 업데이트
  async updateHp(id: number, hp: number): Promise<boolean> {
    const updateResult = await this.userRepository
      .createQueryBuilder()
      .update(User)
      .set({ user_hp: hp })
      .where('user_id = :id', { id })
      .execute();

    if (updateResult.affected === 0) {
      throw this.doWithException.UserNotFound;
    }
    return true;
  }

  // 유저 로그인 시각 업데이트
  async updateLastLoginByKakaoId(kakao_id: number): Promise<boolean> {
    const updateResult = await this.userRepository
      .createQueryBuilder()
      .update(User)
      .set({ last_login: new Date() })
      .where('user_kakao_id = :kakao_id', { kakao_id })
      .execute();

    if (updateResult.affected === 0) {
      throw this.doWithException.UserNotFound;
    }

    return true;
  }

  // 닉네임으로 조회
  async getUserByName(name: string): Promise<User> {
    return await this.userRepository.findOneBy({ user_name: name });
  }

  // 카카오 아이디로 조회
  async getUserByKakaoId(kakao_id: number): Promise<User> {
    return await this.userRepository.findOneBy({ user_kakao_id: kakao_id });
  }
}
