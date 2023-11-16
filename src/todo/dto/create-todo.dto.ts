import { IsNotEmpty } from "class-validator";

export class CreateTodoDto {
    @IsNotEmpty()
    user_id: number; // foreign key

    @IsNotEmpty()
    todo_name: string;

    todo_desc: string;
    
    @IsNotEmpty()
    todo_done: boolean;

    todo_start: Date;

    todo_end: Date;

    grp_id: number; // foreign key

    // path of image, nessary if grp_id is not null
    todo_img: string;
}
