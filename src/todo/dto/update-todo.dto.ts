import { IsNotEmpty } from 'class-validator';

  /**
   * 수정가능 목록
   * 제목: todo_name
   * 내용: todo_desc
   * 라벨: todo_label
   * 날짜: todo_date
   * 완료여부: todo_done
   * 
   * 시작시간: todo_start
   * 종료시간: todo_end
   * 이미지 경로: todo_img
   */

export class UpdateTodoDto {
  // todo_id, user_id, grp_id는 변경 불가

  // essential
  @IsNotEmpty()
  todo_name: string;
  todo_desc: string;
  todo_label: number;
  todo_date: Date;
  todo_done: boolean;

  // optional
  todo_start: string;
  todo_end: string;
  // path of image, nessary if grp_id is not null
  todo_img: string;

}
