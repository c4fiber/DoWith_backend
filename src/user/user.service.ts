import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { User } from './user.entities';
import { CreateUserDto as CreateUserDto } from './dto/create-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DoWithExceptions } from 'src/do-with-exception/do-with-exception';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly doWithException: DoWithExceptions,
  ) {}

  // DB 아이디로 조회
  async getUser(id: number): Promise<User> {
    return await this.userRepository.findOneBy({ user_id: id });
  }

  // 닉네임으로 조회
  async getUserByName(name: string): Promise<User> {
    return await this.userRepository.findOneBy({ user_name: name });
  }

  // 카카오 아이디로 조회
  async getUserByKakaoId(kakaoId: number): Promise<User> {
    return await this.userRepository.findOneBy({ user_kakaoId: kakaoId });
  }

  // 새로운 유저 생성
  // TODO: 응답 Dto 생성
  async createUser(request: CreateUserDto): Promise<number> {
    const { name, tel, kakaoId } = request;

    // 만약 이미 가입된 유저인 경우 예외처리
    if ((await this.getUserByKakaoId(kakaoId)) != null) {
      throw this.doWithException.UserAlreadyExists;
    }

    // 유저 엔티티 생성
    const now = new Date();
    const user = new User();

    user.user_name = name;
    user.user_tel = tel;
    user.user_kakaoId = kakaoId;
    user.regAt = now;
    user.lastLogin = now;
    user.user_hp = 0;
    user.uptAt = null;

    await this.userRepository.save(user);
    return user.user_id;
  }

  // TODO: 유저 정보 수정
  async updateUser(id: number, request: CreateUserDto) {}

  // TODO: 유저 삭제
  async deleteUser(id: number) {}
}
