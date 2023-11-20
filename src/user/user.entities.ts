import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

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

  @Column()
  user_profile: string;

  //   @OneToOne(() => Room)
  //   @JoinColumn()
  //   room_id: number;

  @Column()
  reg_at: Date;

  @Column()
  upt_at: Date;

  @Column()
  last_login: Date;
}
