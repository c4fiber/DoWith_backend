import { Get, Header, Headers, Injectable, Logger } from '@nestjs/common';
import { DoWithExceptions } from 'src/do-with-exception/do-with-exception';
import { UserRequestDto } from 'src/user/dto/user-request.dto';
import { UserResponseDto } from 'src/user/dto/user-response.dto';
import { UserService } from 'src/user/user.service';
import { HttpService } from '@nestjs/axios';
import { AxiosRequestConfig } from 'axios';
import { lastValueFrom, map } from 'rxjs';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UserService,
    private readonly doWithExceptions: DoWithExceptions,
    private readonly httpService: HttpService,
  ) {}

  private kakaoUrl = 'https://kauth.kakao.com/oauth/token';

  // 카카오 아이디로 DB를 검색하여
  // lastLogin 필드를 업데이트
  async login(token: string): Promise<boolean> {
    //

    return await this.usersService.updateLastLoginByKakaoId(token);
  }

  // 인가 코드로 토큰 발급을 요청합니다.
  async oauth(code: string) {
    Logger.debug('카카오에 인증 토큰 요청 필요');
    const config: AxiosRequestConfig = {
      headers: {
        'Content-type': 'application/x-www-form-urlencoded;charset=utf-8',
      },
    };

    const data = {
      grant_type: 'authorization_code',
      client_id: process.env.KAKAO_REST_API_KEY,
      redirect_uri: `${process.env.SERVER}/auth`,
      code: code,
    };

    const params = new URLSearchParams();
    Object.keys(data).forEach((key) => {
      params.append(key, data[key]);
    });

    const response = await lastValueFrom(
      this.httpService.post(this.kakaoUrl, params, config).pipe(
        map((response) => {
          return response.data;
        }),
      ),
    );

    Logger.log(response);
  }
}
