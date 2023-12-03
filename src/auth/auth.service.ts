import {
  Get,
  Header,
  Headers,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { DoWithExceptions } from 'src/utils/do-with-exception/do-with-exception';
import { HttpService } from '@nestjs/axios';
import { AxiosRequestConfig } from 'axios';
import { lastValueFrom, map } from 'rxjs';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/entities/user.entities';
import { Repository } from 'typeorm';
import { SignUpDto } from './dto/singup.dto';

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
    private readonly httpService: HttpService,
    private readonly doWithExceptions: DoWithExceptions,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  private kakaoUrl = process.env.KAKAO_URL;

  // 유저 아이디로 DB를 검색하여
  // lastLogin 필드를 업데이트
  async login(token: string) {
    const { userId } = await this.jwtService.decode(token.substring(7));
    const result: User = await this.userRepository.findOneBy({
      user_id: userId,
    });

    return { result };
  }

  // 새로운 유저 생성
  async signup(
    request: SignUpDto,
  ): Promise<{ result: { user: User; token: string } }> {
    const { user_name, user_tel, user_kakao_id } = request;

    // 만약 이미 가입된 유저인 경우 예외처리
    const found = await this.userRepository
      .createQueryBuilder('user')
      .select()
      .where('user_kakao_id = :user_kakao_id', { user_kakao_id })
      .orWhere('user_name = :user_name', { user_name })
      .getExists();

    if (found == true) {
      throw this.doWithExceptions.UserAlreadyExists;
    }

    // 유저 엔티티 생성
    const now = new Date();
    const user = new User();

    user.user_name = user_name;
    user.user_tel = user_tel;
    user.user_kakao_id = user_kakao_id;
    user.last_login = now;
    user.user_hp = 0;

    // 펫 기본펫으로 (iv, r)
    // 펫 이름

    // 토큰 발행
    const userId = user.user_id;
    const payload = { userId };
    const token = this.jwtService.sign(payload);

    const saveduser: User = await this.userRepository.save(user);
    const result = {
      user: saveduser,
      token: token,
    };

    return { result };
  }

  // 인가 코드로 토큰 발급을 요청합니다.
  async oauth(code: string): Promise<{ token: string; kakao_id: string }> {
    // 카카오 서버로 받은 인가 코드로 토큰 발급 요청
    const kakaoIdToken = await this.requestKakaoToken(code).then((response) =>
      this.jwtService.decode(response.id_token),
    );

    // 토큰 디코딩하여 카카오 유저 정보 확인
    // aud: 앱 링크, sub: 유저 카카오 아이디
    const { sub } = kakaoIdToken;
    Logger.log(
      `Kakao open id token is successfully responsed` +
        `{sub: ${kakaoIdToken.sub}}`,
    );

    // 유저 아이디를 가져와 DB에서 검색하고
    const user: User = await this.userRepository.findOneBy({
      user_kakao_id: sub,
    });

    if (user == null) {
      // 유저가 없는 경우 권한 없음 메시지 전달
      return {
        token: 'access_denied',
        kakao_id: sub,
      };
    }

    const userId = user.user_id;
    const payload = { userId };
    const token = this.jwtService.sign(payload);
    Logger.log(`💜 JWT_TOKEN: ${token}`);
    return {
      token: token,
      kakao_id: user.user_kakao_id,
    };
  }

  async isUserNameUnique(user_name: string) {
    const user = await this.userRepository.createQueryBuilder()
                                    .where({ user_name })
                                    .select(['user_id'])
                                    .getRawOne();
    const result = user == null;
    return { result };
  }

  // === Helpers === //
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
