import { IsNotEmpty } from 'class-validator';

export class UserRequestDto {
  @IsNotEmpty()
  user_name: string;
}
