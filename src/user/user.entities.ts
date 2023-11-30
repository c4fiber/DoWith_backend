import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinTable,
  ManyToMany,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
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

  @Column({ default: 100 })
  user_hp: number;

  @Column({ default: 0 })
  user_cash: number

  // @OneToOne(() => Room)
  // @JoinColumn()
  // room_id: number;

  @ManyToMany(() => User)
  @JoinTable()
  friends: User[];

  @OneToMany(() => Todo, (todo) => todo.user)
  todos: Todo[];

  @Column()
  last_login: Date;

  @CreateDateColumn()
  reg_at: Date;

  @UpdateDateColumn()
  upt_at: Date;

  @DeleteDateColumn()
  del_at: Date;
}
