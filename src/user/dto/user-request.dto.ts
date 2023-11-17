import { IsNotEmpty } from 'class-validator';

export class UserRequestDto {
  @IsNotEmpty()
  name: string;

  @IsNotEmpty()
  tel: string;

  @IsNotEmpty()
  kakaoId: number;
}
