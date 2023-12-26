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
import { DataSource, EntityManager, In, QueryRunner, Repository } from 'typeorm';
import { SignUpDto } from './dto/signup.dto';
import { ItemInventory } from 'src/entities/item-inventory.entity';
import { Room } from 'src/entities/room.entity';
import { InitUser } from 'src/enums/InitUser.enum';
import { UserAchi } from 'src/entities/user_achi.entity';
import { Achievements } from 'src/entities/achievements.entity';
import { ItemShop } from 'src/entities/item-shop.entity';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';

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

  
  /**
   * 새로운 사용자를 생성합니다.
   * @param dto 
   * @returns 
   */
  async register(dto: SignUpDto) {
    const {user_name, user_kakao_id, user_pwd, user_pet_name} = dto;

    if(user_name === undefined || user_pet_name === undefined) {
        // 닉네임 또는 펫 이름을 입력하지 않은 경우
        throw this.doWithExceptions.FailToSignUp;
    }

    if(user_name.length > 10) {
        // 10자 이상 닉네임을 입력할 수 없습니다
        throw this.doWithExceptions.UserNameLimit;
    }

    if(user_kakao_id === undefined && user_pwd === undefined) {
        // 카카오 아이디 또는 비밀번호 중 하나는 존재해야 합니다
        throw this.doWithExceptions.FailToSignUp;
    }

    return await this.dataSource.transaction(async (manager: EntityManager) => {
        
        // 1. 유저 엔티티 생성
        const user: User = new User();
        user.user_name = user_name;

        // 1-2. 카카오 로그인 회원가입인 경우
        user.user_kakao_id = user_kakao_id !== undefined ? user_kakao_id : null;
        
        // 1-3. 비밀번호 기반 회원가입인 경우 암호화
        if(user_pwd !== undefined) {
            const saltOrRounds = 10;
            
            const encrypted = await bcrypt.hash(user_pwd, saltOrRounds);
            console.log(user_pwd, encrypted);
            user.user_pwd = encrypted;
        }
        
        const createUser: User = await manager.save(user);
        const userId = createUser.user_id;


        // 2. 첫 로그인 업적 달성
        const loginAchi: Achievements = await manager.findOneBy(
                                        Achievements,
                                        {achi_id: InitUser.achi_id});

        const userAchi: UserAchi = new UserAchi();
        userAchi.user_id = userId;
        userAchi.achi_id = loginAchi.achi_id;
        await manager.save(userAchi);

        // 3. 펫을 기본펫으로 설정
        const defaultPet: ItemShop = await manager.findOneBy(
                                        ItemShop,
                                        {item_id: InitUser.pet_id});

        const itemInventory: ItemInventory = new ItemInventory();
        itemInventory.user_id = userId;
        itemInventory.pet_name = user_pet_name;
        itemInventory.item_id = defaultPet.item_id;
        itemInventory.pet_exp = InitUser.pet_exp;
        await manager.save(itemInventory);

        // 4. 펫을 룸에 배치
        const room: Room = new Room();
        room.user_id = userId;
        room.item_id = InitUser.pet_id;
        await manager.save(room);

        // 5. 토큰 발행
        const payload = { userId };
        const token = this.jwtService.sign(payload);
        
        // 6. 응답 구성
        const userPet = {
            item_id: defaultPet.item_id,
            type_id: defaultPet.type_id,
            item_name: defaultPet.item_name,
            item_path: defaultPet.item_path,
            pet_name: user_pet_name,
            pet_exp: InitUser.pet_exp,
        };

        const result = {
            user: createUser,
            user_pet: userPet,
            user_achi: loginAchi,
            token: token
        };


        return { result };
    })
  }

  /**
   * 닉네임/비밀번호 기반으로 로그인합니다
   * 로그인 카운드와 업적은 투두 생성에서 처리됩니다
   * @param dto 
   * @returns token
   */
  async login(dto: LoginDto) {
    // 1. 닉네임으로 사용자 검색
    const user = await this.userRepository.findOneBy({user_name: dto.user_name});
    if(user && await bcrypt.compare(dto.user_pwd, user.user_pwd)) {
        // 2. 유효한 사용자인 경우 토큰 발급하여 반환
        const userId = user.user_id;
        const payload = { userId };
        const token = this.jwtService.sign(payload);
        const result = {
            token: token,
        }
        return { result };
    }

    // 3. 유효하지 않은 사용자인 경우 예외
    throw this.doWithExceptions.Authorization;
  }

  // 새로운 유저 생성
  // [위 함수 테스트 완료되는대로 교체 예정]
  async signup(request: SignUpDto) {
    const { user_name, user_kakao_id, user_pet_name } = request;

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
                                //   user_tel:       user_tel,
                                  user_cash:      InitUser.cash,
                                  user_hp:        InitUser.hp,
                                  last_login:     now,
                                  login_cnt:      InitUser.login_cnt, 
                                  login_seq:      InitUser.login_seq, 
                                })
                                .execute();

      const user_id = createUser.identifiers[0].user_id;

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

  
  // === Helpers === //
  // 닉네임 중복검사. (미사용)
  async isUserNameUnique(user_name: string) {
    const user = await this.userRepository.createQueryBuilder()
                                    .where({ user_name })
                                    .select()
                                    .getCount();
    const result = user == 0;
    return { result };
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

  // 유저의 Room에 있는 펫을 가져옵니다. (미사용)
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
