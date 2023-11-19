import { group } from 'console';
import { Group } from 'src/group/entities/group.entity';
import { Column, Entity, JoinTable, ManyToMany, PrimaryGeneratedColumn } from 'typeorm';

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
}
