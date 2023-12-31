import { User } from "src/entities/user.entities";
import { Column, Entity, JoinTable, ManyToMany, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class Achievements {
  @PrimaryGeneratedColumn()
  achi_id: number;

  @Column()
  achi_name: string;

  @Column()
  achi_desc: string;

  @Column()
  achi_img: string;

  @Column()
  achi_score: number;

  @Column({ default: false })
  is_hidden: boolean;

  @ManyToMany(() => User)
  @JoinTable({
    name: 'user_achi',
    joinColumn: {
      name: 'achi_id',
      referencedColumnName: 'achi_id'
    },
    inverseJoinColumn:{
      name: 'user_id',
      referencedColumnName: 'user_id'
    }
  })
  users: User[];
}