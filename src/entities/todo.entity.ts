import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from './user.entities';
import { Routine } from 'src/entities/routine.entity';
import { Category } from 'src/entities/category.entity';

@Entity()
export class Todo {
  @PrimaryGeneratedColumn()
  todo_id: number;

  @Column()
  user_id: number; // foreign key

  @ManyToOne(() => Routine)
  @JoinColumn({ name: 'rout_id', referencedColumnName: 'rout_id' })
  rout_id: number; // foreign key referenced on Routine

  @Column()
  todo_name: string;

  @Column({ nullable: true })
  todo_desc: string;

  @ManyToOne(() => Category)
  @JoinColumn({ name: 'cat_id', referencedColumnName: 'cat_id' })
  todo_label: number;

  @CreateDateColumn({ type: 'date' }) // default: now()
  todo_date: Date;

  @Column({ default: false })
  todo_done: boolean;

  @Column({ nullable: true, type: 'time' })
  todo_start: string;

  @Column({ nullable: true, type: 'time' })
  todo_end: string;

  @Column({ nullable: true })
  grp_id: number; // foreign key

  @Column({ nullable: true })
  todo_img: string;

  @Column({ default: false })
  todo_deleted: boolean;

  @ManyToOne((type) => User, (user) => user.todos)
  user: User;
  // NOTE todo데이터 보존을 위해 CASCADE 미설정
  // TODO ManyToOne: grp_id
  // TODO todo_image: path of image
}
