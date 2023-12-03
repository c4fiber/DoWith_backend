import { IsNotEmpty } from 'class-validator';

export class SignUpDto {
  @IsNotEmpty()
  user_name: string;

  @IsNotEmpty()
  user_tel: string;

  @IsNotEmpty()
  user_kakao_id: string;

  @IsNotEmpty()
  user_pet_name: string;
}
