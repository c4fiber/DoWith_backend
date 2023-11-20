import { Entity, PrimaryColumn } from "typeorm";

@Entity()
export class UserGroup {
  @PrimaryColumn()
  user_id: number;

  @PrimaryColumn()
  grp_id: number;
}