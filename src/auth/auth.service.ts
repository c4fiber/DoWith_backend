import {
  Get,
  Header,
  Headers,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { DoWithExceptions } from 'src/do-with-exception/do-with-exception';
import { UserRequestDto } from 'src/user/dto/user-request.dto';
import { UserResponseDto } from 'src/user/dto/user-response.dto';
import { UserService } from 'src/user/user.service';
import { HttpService } from '@nestjs/axios';
import { AxiosRequestConfig } from 'axios';
import { lastValueFrom, map } from 'rxjs';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/user/user.entities';
import { Repository } from 'typeorm';

export class KakaoTokenResponse {
  token_type: string;
  access_token: string;
  id_token: string;
  expires_in: number;
  refresh_token: string;
  refresh_token_expires_in: number;
  scope: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly usersService: UserService,
    private readonly httpService: HttpService,
    private readonly doWithExceptions: DoWithExceptions,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  private kakaoUrl = 'https://kauth.kakao.com/oauth/token';

  // 카카오 아이디로 DB를 검색하여
  // lastLogin 필드를 업데이트
  async login(token: string): Promise<boolean> {
    //

    return await this.usersService.updateLastLoginByKakaoId(token);
  }

  // 인가 코드로 토큰 발급을 요청합니다.
  async oauth(code: string): Promise<string> {
    // 카카오 서버로 받은 인가 코드로 토큰 발급 요청
    const kakaoOpenId = await this.requestKakaoToken(code).then((response) =>
      this.jwtService.decode(response.id_token),
    );

    // 토큰 디코딩하여 카카오 유저 정보 확인
    Logger.log(`Kakao openID payload: ${kakaoOpenId.sub}`);
    const { aud, sub } = kakaoOpenId;

    // 유저 아이디를 가져와 DB에서 검색하고
    const user: User = await this.userRepository.findOneBy({
      user_kakao_id: sub,
    });

    if (user == null) {
      // 유저가 없는 경우 권한 없음 메시지 전달
      return `${aud}://oauth?token=access_denied`;
    }

    const kakaoId = user.user_kakao_id;
    const payload = { kakaoId };
    const token = await this.jwtService.sign(payload);
    return `${aud}://oauth?token=${token}`;
  }

  // 인가 코드를 카카오 서버로 보내어 토큰 발급을 요청합니다.
  private async requestKakaoToken(code: string): Promise<KakaoTokenResponse> {
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
      this.httpService
        .post<KakaoTokenResponse>(this.kakaoUrl, params, config)
        .pipe(
          map((res) => {
            return res.data;
          }),
        ),
    );

    return response;
  }
}
