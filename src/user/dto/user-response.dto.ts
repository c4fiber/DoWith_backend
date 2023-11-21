import { IsNotEmpty } from 'class-validator';
import { User } from '../user.entities';

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

  constructor(user: User) {
    this.user_id = user.user_id;
    this.user_name = user.user_name;
    this.user_tel = user.user_tel;
    this.user_kakao_id = user.user_kakao_id;
    this.user_hp = user.user_hp;
  }
}
