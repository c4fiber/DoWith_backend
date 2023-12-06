import {
  Get,
  Header,
  Headers,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { DoWithExceptions } from 'src/utils/do-with-exception';
import { UserRequestDto } from 'src/features/user/dto/user-request.dto';
import { UserResponseDto } from 'src/features/user/dto/user-response.dto';
import { UserService } from 'src/features/user/user.service';
import { HttpService } from '@nestjs/axios';
import { AxiosRequestConfig } from 'axios';
import { lastValueFrom, map } from 'rxjs';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/entities/user.entities';
import { DataSource, In, QueryRunner, Repository } from 'typeorm';
import { SignUpDto } from './dto/singup.dto';
import { ItemInventory } from 'src/entities/item-inventory.entity';
import { Room } from 'src/entities/room.entity';
import { InitUser } from 'src/enums/InitUser.enum';
import { UserAchi } from 'src/entities/user_achi.entity';
import { Achievements } from 'src/entities/achievements.entity';

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
    private readonly dataSource: DataSource,
  ) {}

  private kakaoUrl = process.env.KAKAO_URL;

  // 새로운 유저 생성
  async signup(request: SignUpDto) {
    const { user_name, user_tel, user_kakao_id, user_pet_name } = request;

    if(user_name.length > 10) {
      throw this.doWithExceptions.UserNameLimit;
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const now = new Date();

      // 1. 유저 엔티티 생성
      const createUser = await queryRunner.manager.createQueryBuilder()
                                .insert()
                                .into(User)
                                .values({
                                  user_name:      user_name,
                                  user_kakao_id:  user_kakao_id,
                                  user_tel:       user_tel,
                                  user_cash:      InitUser.cash,
                                  user_hp:        InitUser.hp,
                                  last_login:     now,
                                  login_cnt:      InitUser.login_cnt, 
                                  login_seq:      InitUser.login_seq, 
                                })
                                .execute();

      const user_id = createUser.identifiers[0].user_id;
      Logger.debug(`new user id ${user_id}`);

      // 2. 첫 로그인 업적 달성
      const loginAchi = await queryRunner.manager.findOneBy(
                                Achievements,
                                {achi_id: InitUser.achi_id});

      await queryRunner.manager.createQueryBuilder()
                               .insert()
                               .into(UserAchi)
                               .values({
                                 user_id: user_id,
                                 achi_id: InitUser.achi_id
                               })
                               .execute();
      
      // 3. 펫을 기본펫으로 설정
      await queryRunner.manager.createQueryBuilder()
                            .insert()
                            .into(ItemInventory)
                            .values({
                                user_id:   user_id,
                                item_id:   InitUser.pet_id,
                                pet_name:  user_pet_name,
                                pet_exp:   InitUser.pet_exp,
                            })
                            .execute();


      // 4. 펫을 룸에 배치
      await queryRunner.manager.createQueryBuilder()
                            .insert()
                            .into(Room)
                            .values({
                                user_id:   user_id,
                                item_id:   InitUser.pet_id
                            })
                            .execute();
      

      const mainPet = await this.getUserMainPet(queryRunner, user_id);

      // 5. 토큰 발행
      const payload = { user_id };
      const token = this.jwtService.sign(payload);

      const saveduser: User = await queryRunner.manager.findOneBy(User, {user_id: user_id});

      const result = {
        user: saveduser,
        user_pet: mainPet,
        user_achi: loginAchi,
        token: token,
      };

      await queryRunner.commitTransaction();
      return { result };

    } catch(error) {
      await queryRunner.rollbackTransaction();
      throw new Error(error);

    } finally {
      await queryRunner.release();
      
    }
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
    return {
      token: token,
      kakao_id: user.user_kakao_id,
    };
  }

  // 닉네임 중복검사.
  async isUserNameUnique(user_name: string) {
    const user = await this.userRepository.createQueryBuilder()
                                    .where({ user_name })
                                    .select()
                                    .getCount();
    const result = user == 0;
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

  // 유저의 Room에 있는 펫을 가져옵니다.
  private async getUserMainPet(queryRunner: QueryRunner, user_id: number) {
    return await queryRunner.manager
      .getRepository(Room)
      .createQueryBuilder('r')
      .leftJoin('item_shop', 'ish', 'r.item_id = ish.item_id AND ish.type_id = :PET_TYPE')
      .leftJoin('item_inventory', 'iv', 'r.item_id = iv.item_id AND iv.user_id = :user_id')
      .where('r.user_id = :user_id', { user_id: user_id, PET_TYPE: 1 })
      .select([
        'ish.item_id as item_id',
        'ish.type_id as item_type',
        'ish.item_name as item_name',
        'ish.item_path as item_path',
        'iv.pet_name as pet_name',
        'iv.pet_exp as pet_exp',
      ])
      .getRawOne();
  }
}
