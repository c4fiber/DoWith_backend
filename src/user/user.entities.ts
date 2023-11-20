
import { Column, Entity, ManyToMany, JoinTable, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Todo } from '../todo/todo.entity';
import { Group } from 'src/group/entities/group.entity';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  user_id: number;

  @Column({ unique: true })
  user_name: string;

  @Column()
  user_tel: string;

  @Column()
  user_kakaoId: number;

  @Column()
  user_hp: number;

  //   @OneToOne(() => Room)
  //   @JoinColumn()
  //   room_id: number;

  @Column()
  regAt: Date;

  @Column()
  uptAt: Date;

  @Column()
  lastLogin: Date;

  @OneToMany(() => Todo, (todo) => todo.user)
  todos: Todo[];
}
