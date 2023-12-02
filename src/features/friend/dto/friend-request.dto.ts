import { IsNotEmpty } from 'class-validator';

export class FreindRequestDto {
  @IsNotEmpty()
  user_id: number;

  @IsNotEmpty()
  friend_id: number;
}
