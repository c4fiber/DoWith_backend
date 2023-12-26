import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
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

  @Column({ nullable: true })
  user_tel: string;

  @Column({ nullable: true })
  user_pwd: string;

  @Column({ unique: true, nullable: true })
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

  @ManyToMany(() => User)
  @JoinTable({
    name: 'user_friends',
    joinColumn: {
        name: 'user_id',
        referencedColumnName: 'user_id',
    },
    inverseJoinColumn: {
        name: 'friend_id',
        referencedColumnName: 'user_id',
    }
  })
  friends: User[];

  @OneToMany(() => Todo, (todo) => todo.user)
  todos: Todo[];

  @Column({ default: () => 'CURRENT_DATE' })
  last_login: Date;
  
  @Column({nullable: true})
  socket_id: string;

  @CreateDateColumn()
  reg_at: Date;

  @UpdateDateColumn()
  upt_at: Date;

  @DeleteDateColumn()
  del_at: Date;
}
