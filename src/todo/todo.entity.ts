import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Todo {
    @PrimaryGeneratedColumn()
    todo_id: number;
    
    @Column()
    user_id: number; // foreign key

    @Column()
    todo_name: string;

    @Column()
    todo_desc: string;
    
    @Column()
    todo_date: Date;

    @Column()
    todo_done: boolean;

    @Column()
    todo_start: Date;

    @Column()
    todo_end: Date;

    @Column()
    grp_id: number; // foreign key

    @Column()
    todo_img: string;

    // TODO ManyToOne: user_id
    // TODO ManyToOne: grp_id
    // TODO todo_image: path of image

}