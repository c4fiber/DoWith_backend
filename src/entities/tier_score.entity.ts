import { Column, Entity, PrimaryColumn } from "typeorm";

@Entity('tier_score')
export class TierScore {
  @PrimaryColumn()
  user_id: number;

  @Column({ nullable: true, default: 0 })
  pet_exp: number;

  @Column({ nullable: true, default: 0 })
  todo_cnt: number;

  @Column({ nullable: true, default: 0 })
  rout_cnt: number;

  @Column({ nullable: true, default: 0 })
  achi_score: number;
}