import { CreateDateColumn, Entity, PrimaryColumn } from "typeorm";

@Entity()
export class UserAchi {
  @PrimaryColumn()
  user_id: number;

  @PrimaryColumn()
  achi_id: number;

  @CreateDateColumn()
  reg_at: Date;
}