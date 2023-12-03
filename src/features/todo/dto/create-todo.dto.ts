import { IsNotEmpty } from 'class-validator';

export class CreateTodoDto {
  @IsNotEmpty()
  user_id: number; // foreign key

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
  grp_id: number; // foreign key
  // path of image, nessary if grp_id is not null
  todo_img: string;
  rout_id: number;

}
