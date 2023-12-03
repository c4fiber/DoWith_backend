import { Todo } from '../todo.entity';

export class UpdateResponseDto {
  todo: Todo;
  pet_exp_change: number; // 증가한 양만큼 반환
  user_cash_change: number; // 증가한 양만큼 반환
}
