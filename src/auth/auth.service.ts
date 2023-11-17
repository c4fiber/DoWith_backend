import { Injectable } from '@nestjs/common';
import { DoWithExceptions } from 'src/do-with-exception/do-with-exception';
import { UserRequestDto } from 'src/user/dto/user-request.dto';
import { UserResponseDto } from 'src/user/dto/user-response.dto';
import { UserService } from 'src/user/user.service';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UserService,
    private doWithExceptions: DoWithExceptions,
  ) {}

  // 새로운 유저를 생성
  async signup(request: UserRequestDto): Promise<UserResponseDto> {
    const { name } = request;
    await this.usersService.getUserByName(name).then((user) => {
      if (user !== null) {
        // 중복 닉네임 처리
        throw this.doWithExceptions.UserNameNotUnique;
      }
    });

    return await this.usersService.createUser(request);
  }

  // 카카오 아이디로 DB를 검색하여
  // lastLogin 필드를 업데이트
  async login(kakaoId: number): Promise<boolean> {
    return await this.usersService.updateLastLoginByKakaoId(kakaoId);
  }
}
