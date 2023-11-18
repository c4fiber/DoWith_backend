import { IsNotEmpty } from 'class-validator';

export class FriendRequestDto {
  @IsNotEmpty()
  friend_id: number;
}
