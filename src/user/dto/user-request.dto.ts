import { IsNotEmpty } from 'class-validator';

export class UserRequestDto {
  @IsNotEmpty()
  user_name: string;

  @IsNotEmpty()
  user_tel: string;

  @IsNotEmpty()
  user_kakao_id: string;
}
