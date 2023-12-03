import { IsNotEmpty } from 'class-validator';
import { User } from '../../../entities/user.entities';

export class UserResponseDto {
  @IsNotEmpty()
  user_id: number;

  @IsNotEmpty()
  user_name: string;

  @IsNotEmpty()
  user_tel: string;

  @IsNotEmpty()
  user_kakao_id: string;

  @IsNotEmpty()
  user_hp: number;

  @IsNotEmpty()
  socket_id: string;

  @IsNotEmpty()
  user_cash: number;

  @IsNotEmpty()
  login_cnt: number;

  @IsNotEmpty()
  login_seq: number;

  @IsNotEmpty()
  last_login: Date;

  constructor(user: User) {
    this.user_id = user.user_id;
    this.user_name = user.user_name;
    this.user_tel = user.user_tel;
    this.user_kakao_id = user.user_kakao_id;
    this.user_hp = user.user_hp;
    this.socket_id = user.socket_id;
    this.user_cash = user.user_cash;
    this.login_cnt = user.login_cnt;
    this.login_seq = user.login_seq;
    this.last_login = user.last_login;
  }
}
