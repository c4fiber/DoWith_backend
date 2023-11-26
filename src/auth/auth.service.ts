import { Get, Header, Headers, Injectable } from '@nestjs/common';
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

  // 카카오 아이디로 DB를 검색하여
  // lastLogin 필드를 업데이트
  async login(token: string): Promise<boolean> {
    //

    return await this.usersService.updateLastLoginByKakaoId(token);
  }
}
