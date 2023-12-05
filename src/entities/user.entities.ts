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
import { Todo } from './todo.entity';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  user_id: number;

  @Column({ unique: true })
  user_name: string;

  @Column()
  user_tel: string;

  @Column({ unique: true })
  user_kakao_id: string;

  @Column({ default: 10 })
  user_hp: number;

  @Column({ default: 0 })
  user_cash: number;

  @Column({ default: 0 })
  total_exp: number;

  @Column({ default: 1 })
  login_cnt: number;

  @Column({ default: 1 })
  login_seq: number;

  // @OneToOne(() => Room)
  // @JoinColumn()
  // room_id: number;

  @ManyToMany(() => User)
  @JoinTable()
  // TODO: @JoinColumn({ name: '', referencedColumnName: '' })
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

  @Column({nullable: true})
  socket_id: string;
}
