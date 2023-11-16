import { IsNotEmpty } from "class-validator";

export class CreateTodoDto {
    @IsNotEmpty()
    user_id: number; // foreign key

    @IsNotEmpty()
    todo_name: string

    todo_desc: string = null;

    @IsNotEmpty()
    todo_date: Date;
    
    @IsNotEmpty()
    todo_done: boolean;

    todo_start: Date = null;
    
    todo_end: Date = null;

    grp_id: number = null; // foreign key

    // path of image, nessary if grp_id is not null
    todo_img: string = null;
}
