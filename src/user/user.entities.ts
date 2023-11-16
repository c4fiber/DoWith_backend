import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  Timestamp,
} from 'typeorm';

/** Table User {
    user_id integer [pk, unique]
    user_email varchar [not null]
    user_tel varchar [not null]
    user_name varchar [not null, unique]
    user_hp integer [not null]
    room_id integer [ref: - Room.room_id]
    
    reg_at timestamp [not null]
    upt_at timestamp [null]
    last_login timestamp [not null]
  } */

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

  /* metadata */
  @Column()
  regAt: Date;

  @Column()
  uptAt: Date;

  @Column()
  lastLogin: Date;
}
