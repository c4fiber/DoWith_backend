import { BadRequestException, Injectable } from '@nestjs/common';
import { User } from 'src/user/user.entities';
import { UserService } from 'src/user/user.service';

@Injectable()
export class AuthService {
  constructor(private usersService: UserService) {}

  // 로그인 DB에 카카오 아이디가 존재하면 유저
  async login(kakaoId: number): Promise<User> {
    const user = await this.usersService.getUserByKakaoId(kakaoId);
    if (user === null) {
      //TODO:
      throw BadRequestException;
    }
    return user;
  }
}
