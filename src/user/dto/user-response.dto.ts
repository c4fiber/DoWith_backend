import { IsNotEmpty } from 'class-validator';
import { User } from '../user.entities';

export class UserResponseDto {
  @IsNotEmpty()
  id: number;

  @IsNotEmpty()
  name: string;

  @IsNotEmpty()
  tel: string;

  @IsNotEmpty()
  hp: number;

  constructor(user: User) {
    this.id = user.user_id;
    this.name = user.user_name;
    this.tel = user.user_tel;
    this.hp = user.user_hp;
  }
}
