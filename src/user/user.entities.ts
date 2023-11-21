import {
  Column,
  Entity,
  JoinTable,
  ManyToMany,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Todo } from '../todo/todo.entity';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  user_id: number;

  @Column({ unique: true })
  user_name: string;

  @Column()
  user_tel: string;

  @Column()
  user_kakao_id: string;

  @Column()
  user_hp: number;

  // @OneToOne(() => Room)
  // @JoinColumn()
  // room_id: number;

  @ManyToMany(() => User)
  @JoinTable()
  friends: User[];

  @Column()
  reg_at: Date;

  @Column()
  upt_at: Date;

  @Column()
  last_login: Date;

  @OneToMany(() => Todo, (todo) => todo.user)
  todos: Todo[];
}
