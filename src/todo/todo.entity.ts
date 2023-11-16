import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Todo {
    @PrimaryGeneratedColumn()
    todo_id: number;
    
    @Column()
    user_id: number; // foreign key

    @Column()
    todo_name: string;

    @Column({ nullable: true })
    todo_desc: string;
    
    @CreateDateColumn()
    todo_date: Date;

    @Column({ default: false })
    todo_done: boolean;

    @Column({ nullable: true })
    todo_start: Date;

    @Column({ nullable: true })
    todo_end: Date;

    @Column({ nullable: true })
    grp_id: number; // foreign key

    @Column({ nullable: true })
    todo_img: string;

    // TODO ManyToOne: user_id
    // TODO ManyToOne: grp_id
    // TODO todo_image: path of image

}