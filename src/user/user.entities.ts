import {
  Column,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

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
}
